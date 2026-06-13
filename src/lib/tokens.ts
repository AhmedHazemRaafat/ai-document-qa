/**
 * Approximate token count using the common ~4 characters per token heuristic.
 * Good enough for chunk sizing without pulling in tiktoken.
 */
export function estimateTokenCount(text: string): number {
  if (!text.trim()) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars).trim();
}
