import type { MarkdownOverlap } from '@cem/core';

export interface MarkdownDoc {
  readonly path: string;
  readonly content: string;
}

/**
 * Normalize content into a set of significant lines (trimmed, lowercased, and
 * long enough to be meaningful) for similarity comparison.
 */
export function shingleLines(content: string, minLength = 12): Set<string> {
  const set = new Set<string>();
  for (const raw of content.split(/\r\n|\r|\n/)) {
    const line = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    if (line.length >= minLength) set.add(line);
  }
  return set;
}

/** Jaccard similarity between two sets, in [0, 1]. */
export function jaccard<T>(a: Set<T>, b: Set<T>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const item of small) {
    if (large.has(item)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Count shared significant lines between two sets. */
export function sharedLineCount<T>(a: Set<T>, b: Set<T>): number {
  let shared = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const item of small) if (large.has(item)) shared += 1;
  return shared;
}

/**
 * Detect content overlap between markdown documents. Returns pairs whose
 * similarity is at or above `threshold`, sorted by similarity descending.
 */
export function detectOverlaps(docs: readonly MarkdownDoc[], threshold = 0.25): MarkdownOverlap[] {
  const shingled = docs.map((doc) => ({ path: doc.path, set: shingleLines(doc.content) }));
  const overlaps: MarkdownOverlap[] = [];

  for (let i = 0; i < shingled.length; i += 1) {
    for (let j = i + 1; j < shingled.length; j += 1) {
      const a = shingled[i]!;
      const b = shingled[j]!;
      const similarity = jaccard(a.set, b.set);
      if (similarity >= threshold) {
        overlaps.push({
          a: a.path,
          b: b.path,
          similarity: Number(similarity.toFixed(4)),
          sharedLines: sharedLineCount(a.set, b.set),
        });
      }
    }
  }

  return overlaps.sort((x, y) => y.similarity - x.similarity);
}
