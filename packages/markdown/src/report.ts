import type { MarkdownOverlap, MarkdownStats } from '@cem/core';
import { detectOverlaps, type MarkdownDoc } from './overlap.js';

export interface TokenReportOptions {
  /** Files with more tokens than this are flagged as "large". */
  readonly largeFileTokenThreshold?: number;
  /** Overlap similarity at/above this is flagged as redundant. */
  readonly overlapThreshold?: number;
}

export interface FileTokenRow {
  readonly path: string;
  readonly name: string;
  readonly tokens: number;
  readonly size: number;
  readonly lines: number;
}

export interface TokenReport {
  readonly totalFiles: number;
  readonly totalTokens: number;
  readonly totalBytes: number;
  /** Every file, sorted by tokens descending. */
  readonly files: readonly FileTokenRow[];
  /** Files exceeding the large-file threshold. */
  readonly largeFiles: readonly FileTokenRow[];
  /** Redundant / overlapping document pairs. */
  readonly overlaps: readonly MarkdownOverlap[];
  /** Estimated tokens that could be reclaimed by de-duplicating overlaps. */
  readonly estimatedWastedTokens: number;
  readonly recommendations: readonly string[];
}

/**
 * Build a token-waste report from markdown stats. Highlights heavy files and
 * duplicated content so the user can trim their context footprint.
 */
export function buildTokenReport(
  stats: readonly MarkdownStats[],
  docs: readonly MarkdownDoc[] = [],
  options: TokenReportOptions = {},
): TokenReport {
  const largeThreshold = options.largeFileTokenThreshold ?? 4000;
  const overlapThreshold = options.overlapThreshold ?? 0.4;

  const files: FileTokenRow[] = stats
    .map((s) => ({ path: s.path, name: s.name, tokens: s.tokens, size: s.size, lines: s.lines }))
    .sort((a, b) => b.tokens - a.tokens);

  const totalTokens = files.reduce((sum, f) => sum + f.tokens, 0);
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const largeFiles = files.filter((f) => f.tokens >= largeThreshold);
  const overlaps = docs.length > 0 ? detectOverlaps(docs, overlapThreshold) : [];

  const tokenByPath = new Map(stats.map((s) => [s.path, s.tokens]));
  let estimatedWastedTokens = 0;
  for (const overlap of overlaps) {
    const smaller = Math.min(tokenByPath.get(overlap.a) ?? 0, tokenByPath.get(overlap.b) ?? 0);
    estimatedWastedTokens += Math.round(smaller * overlap.similarity);
  }

  const recommendations: string[] = [];
  if (largeFiles.length > 0) {
    recommendations.push(
      `${largeFiles.length} file(s) exceed ${largeThreshold} tokens — consider splitting or trimming them.`,
    );
  }
  if (overlaps.length > 0) {
    recommendations.push(
      `${overlaps.length} document pair(s) overlap heavily — extract shared content into a single referenced file.`,
    );
  }
  if (recommendations.length === 0) {
    recommendations.push('No obvious context waste detected. Nice and lean!');
  }

  return {
    totalFiles: files.length,
    totalTokens,
    totalBytes,
    files,
    largeFiles,
    overlaps,
    estimatedWastedTokens,
    recommendations,
  };
}
