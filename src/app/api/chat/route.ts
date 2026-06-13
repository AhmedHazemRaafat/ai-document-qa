import { auth } from "@/auth";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { embedText, isOpenAiRateLimitError } from "@/lib/ai/embed";
import {
  buildRagSystemPrompt,
  chunksToCitations,
  HALLUCINATION_GUARD_MESSAGE,
  type Citation,
} from "@/lib/ai/rag";
import { searchSimilarChunks } from "@/lib/ai/search";
import { CHAT_MODEL, SIMILARITY_THRESHOLD } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface ChatRequestBody {
  messages: UIMessage[];
  documentId: string;
  sessionId: string;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as ChatRequestBody;
    const { messages, documentId, sessionId } = body;

    if (!documentId || !sessionId || !messages?.length) {
      return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
        status: "READY",
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or not ready." },
        { status: 404 }
      );
    }

    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        documentId,
        userId: session.user.id,
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found." }, { status: 404 });
    }

    const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
    const question = lastUserMessage?.parts
      ?.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    await prisma.chatMessage.create({
      data: {
        sessionId,
        role: "USER",
        content: question,
      },
    });

    const queryEmbedding = await embedText(question);
    const retrievedChunks = await searchSimilarChunks(documentId, queryEmbedding);
    const bestSimilarity = retrievedChunks[0]?.similarity ?? 0;
    const citations: Citation[] = chunksToCitations(retrievedChunks);

    if (bestSimilarity < SIMILARITY_THRESHOLD) {
      await prisma.chatMessage.create({
        data: {
          sessionId,
          role: "ASSISTANT",
          content: HALLUCINATION_GUARD_MESSAGE,
          citations: [],
        },
      });

      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      const result = streamText({
        model: openai(CHAT_MODEL),
        prompt: HALLUCINATION_GUARD_MESSAGE,
      });

      return result.toUIMessageStreamResponse({
        messageMetadata: () => ({ citations: [] as Citation[] }),
        onFinish: async ({ responseMessage }) => {
          void responseMessage;
        },
      });
    }

    const system = buildRagSystemPrompt(retrievedChunks);
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: openai(CHAT_MODEL),
      system,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type === "finish") {
          return { citations };
        }
        return undefined;
      },
      onFinish: async ({ responseMessage }) => {
        const assistantText = responseMessage.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n");

        await prisma.chatMessage.create({
          data: {
            sessionId,
            role: "ASSISTANT",
            content: assistantText,
            citations: citations as unknown as Prisma.InputJsonValue,
          },
        });

        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { updatedAt: new Date() },
        });
      },
    });
  } catch (error) {
    if (isOpenAiRateLimitError(error)) {
      return NextResponse.json(
        { error: "OpenAI rate limit reached. Please try again shortly." },
        { status: 429 }
      );
    }

    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate an answer." },
      { status: 500 }
    );
  }
}
