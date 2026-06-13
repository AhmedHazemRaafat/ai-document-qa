import {
  CHUNK_MAX_TOKENS,
  CHUNK_OVERLAP_TOKENS,
} from "@/lib/constants";
import { estimateTokenCount, truncateToTokenBudget } from "@/lib/tokens";
import type { ParsedPage } from "@/lib/pdf/parse";

export interface TextChunk {
  chunkIndex: number;
  pageNumber: number;
  content: string;
  tokenCount: number;
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function splitParagraphByTokens(paragraph: string): string[] {
  const tokens = estimateTokenCount(paragraph);
  if (tokens <= CHUNK_MAX_TOKENS) {
    return [paragraph];
  }

  const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(Boolean);
  const parts: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (estimateTokenCount(candidate) <= CHUNK_MAX_TOKENS) {
      current = candidate;
      continue;
    }

    if (current) {
      parts.push(current);
      current = sentence;
    } else {
      parts.push(truncateToTokenBudget(sentence, CHUNK_MAX_TOKENS));
      current = "";
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function applyOverlap(chunks: TextChunk[]): TextChunk[] {
  if (chunks.length <= 1 || CHUNK_OVERLAP_TOKENS <= 0) {
    return chunks;
  }

  const overlapped: TextChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let content = chunk.content;

    if (i > 0) {
      const previous = chunks[i - 1].content;
      const overlapText = truncateToTokenBudget(previous, CHUNK_OVERLAP_TOKENS);
      content = `${overlapText}\n\n${content}`;
    }

    overlapped.push({
      ...chunk,
      content,
      tokenCount: estimateTokenCount(content),
    });
  }

  return overlapped;
}

export function chunkDocumentPages(pages: ParsedPage[]): TextChunk[] {
  const units: Array<{ pageNumber: number; text: string }> = [];

  for (const page of pages) {
    const paragraphs = splitIntoParagraphs(page.text);
    for (const paragraph of paragraphs) {
      for (const part of splitParagraphByTokens(paragraph)) {
        units.push({ pageNumber: page.pageNumber, text: part });
      }
    }
  }

  const rawChunks: TextChunk[] = [];
  let currentText = "";
  let currentPage = units[0]?.pageNumber ?? 1;

  const flush = () => {
    if (!currentText.trim()) return;
    rawChunks.push({
      chunkIndex: rawChunks.length,
      pageNumber: currentPage,
      content: currentText.trim(),
      tokenCount: estimateTokenCount(currentText),
    });
    currentText = "";
  };

  for (const unit of units) {
    const candidate = currentText ? `${currentText}\n\n${unit.text}` : unit.text;

    if (estimateTokenCount(candidate) <= CHUNK_MAX_TOKENS) {
      if (!currentText) {
        currentPage = unit.pageNumber;
      }
      currentText = candidate;
      continue;
    }

    flush();
    currentPage = unit.pageNumber;
    currentText = unit.text;
  }

  flush();

  return applyOverlap(rawChunks).map((chunk, index) => ({
    ...chunk,
    chunkIndex: index,
  }));
}
