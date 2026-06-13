import { createId } from "@/lib/id";
import { embedTexts, isOpenAiRateLimitError } from "@/lib/ai/embed";
import { insertChunkWithEmbedding } from "@/lib/ai/search";
import { chunkDocumentPages } from "@/lib/pdf/chunk";
import { parsePdfBuffer } from "@/lib/pdf/parse";
import { prisma } from "@/lib/prisma";

const EMBED_BATCH_SIZE = 20;

export async function processDocument(documentId: string, pdfBuffer: Buffer): Promise<void> {
  try {
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "PROCESSING",
        processingProgress: 5,
        errorMessage: null,
      },
    });

    const pages = await parsePdfBuffer(pdfBuffer);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        pageCount: pages.length,
        processingProgress: 20,
      },
    });

    const chunks = chunkDocumentPages(pages);

    if (chunks.length === 0) {
      throw new Error("No text chunks could be created from this PDF");
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM "Chunk" WHERE "documentId" = $1`,
      documentId
    );

    let processed = 0;

    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
      const embeddings = await embedTexts(batch.map((chunk) => chunk.content));

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        await insertChunkWithEmbedding({
          id: createId(),
          documentId,
          chunkIndex: chunk.chunkIndex,
          pageNumber: chunk.pageNumber,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          embedding: embeddings[j],
        });
      }

      processed += batch.length;
      const progress = 20 + Math.floor((processed / chunks.length) * 75);

      await prisma.document.update({
        where: { id: documentId },
        data: { processingProgress: Math.min(progress, 95) },
      });
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "READY",
        processingProgress: 100,
        errorMessage: null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? isOpenAiRateLimitError(error)
          ? "OpenAI rate limit reached. Please try again in a few minutes."
          : error.message
        : "Failed to process document";

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });

    throw error;
  }
}
