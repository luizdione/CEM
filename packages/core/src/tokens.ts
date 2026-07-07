import { CHARS_PER_TOKEN } from '@cem/shared';

/**
 * Estimate the number of tokens in a piece of text.
 *
 * This is a heuristic — it does NOT call any Anthropic tokenizer or API and is
 * intended only for relative comparison (which files are "heavy"). It blends
 * the well-known chars/4 rule with a word/punctuation piece count so both prose
 * and code produce sensible numbers.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const chars = text.length;
  const pieces = text.match(/\w+|[^\s\w]/g) ?? [];
  const byChars = chars / CHARS_PER_TOKEN;
  const byPieces = pieces.length * 1.3;
  return Math.max(1, Math.round((byChars + byPieces) / 2));
}

/** Count non-empty logical lines. */
export function countLines(text: string): number {
  if (!text) return 0;
  return text.split(/\r\n|\r|\n/).length;
}
