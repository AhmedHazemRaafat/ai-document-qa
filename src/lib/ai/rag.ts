export interface Citation {
  chunkId: string;
  pageNumber: number;
  snippet: string;
  similarity: number;
}

export function buildSnippet(content: string, maxLength = 200): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}…`;
}

export function chunksToCitations(
  chunks: Array<{
    id: string;
    pageNumber: number;
    content: string;
    similarity: number;
  }>
): Citation[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.id,
    pageNumber: chunk.pageNumber,
    snippet: buildSnippet(chunk.content),
    similarity: chunk.similarity,
  }));
}

export function buildRagSystemPrompt(chunks: Array<{ pageNumber: number; content: string }>): string {
  const context = chunks
    .map(
      (chunk, index) =>
        `[Source ${index + 1} | Page ${chunk.pageNumber}]\n${chunk.content}`
    )
    .join("\n\n");

  return `You are a helpful document Q&A assistant. Answer the user's question using ONLY the provided source excerpts from their uploaded PDF.

Rules:
- Base your answer strictly on the provided sources.
- If the sources do not contain enough information, say you could not find relevant information.
- Be concise and accurate.
- When referencing information, mention the page number when possible.

Sources:
${context}`;
}

export const HALLUCINATION_GUARD_MESSAGE =
  "I couldn't find relevant information in this document.";
