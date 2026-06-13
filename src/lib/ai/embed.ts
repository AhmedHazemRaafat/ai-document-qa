import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { EMBEDDING_MODEL } from "@/lib/constants";

const embeddingModel = openai.embeddingModel(EMBEDDING_MODEL);

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  });

  return embeddings;
}

export function isOpenAiRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("rate limit") ||
    message.includes("429") ||
    message.includes("quota")
  );
}
