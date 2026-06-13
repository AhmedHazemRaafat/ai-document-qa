import { prisma } from "@/lib/prisma";
import { TOP_K_CHUNKS } from "@/lib/constants";

export interface RetrievedChunk {
  id: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  similarity: number;
}

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function searchSimilarChunks(
  documentId: string,
  queryEmbedding: number[],
  limit = TOP_K_CHUNKS
): Promise<RetrievedChunk[]> {
  const vector = toVectorLiteral(queryEmbedding);

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      chunkIndex: number;
      pageNumber: number;
      content: string;
      similarity: number;
    }>
  >(
    `
    SELECT
      id,
      "chunkIndex",
      "pageNumber",
      content,
      1 - (embedding <=> $1::vector) AS similarity
    FROM "Chunk"
    WHERE "documentId" = $2
      AND embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $3
    `,
    vector,
    documentId,
    limit
  );

  return rows.map((row) => ({
    ...row,
    similarity: Number(row.similarity),
  }));
}

export async function insertChunkWithEmbedding(input: {
  id: string;
  documentId: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
  tokenCount: number;
  embedding: number[];
}): Promise<void> {
  const vector = toVectorLiteral(input.embedding);

  await prisma.$executeRawUnsafe(
    `
    INSERT INTO "Chunk" (
      id,
      "documentId",
      "chunkIndex",
      "pageNumber",
      content,
      "tokenCount",
      embedding,
      "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::vector, NOW())
    `,
    input.id,
    input.documentId,
    input.chunkIndex,
    input.pageNumber,
    input.content,
    input.tokenCount,
    vector
  );
}
