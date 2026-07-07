import { basename } from 'node:path';
import { readText } from '@cem/shared';
import { type ArtifactScope, type MarkdownStats, countLines, estimateTokens } from '@cem/core';

const LINK_RE = /\[[^\]]*\]\(([^)\s]+)\)/g;
const BARE_FILE_RE = /(?:^|\s)([\w./-]+\.(?:md|markdown|mdx|json|ya?ml|toml))\b/gi;

/** Extract file references (local links and bare file mentions). */
export function extractReferences(content: string): string[] {
  const refs = new Set<string>();

  for (const match of content.matchAll(LINK_RE)) {
    const target = match[1];
    if (!target) continue;
    if (/^(https?:|mailto:|#|tel:)/i.test(target)) continue;
    refs.add(target);
  }
  for (const match of content.matchAll(BARE_FILE_RE)) {
    const target = match[1]?.trim();
    if (target) refs.add(target);
  }
  return [...refs];
}

/** Count ATX headings (`#`, `##`, …). */
export function countHeadings(content: string): number {
  let count = 0;
  for (const line of content.split(/\r\n|\r|\n/)) {
    if (/^#{1,6}\s/.test(line)) count += 1;
  }
  return count;
}

/** Analyze markdown content already loaded into memory. */
export function analyzeMarkdownContent(
  content: string,
  filePath: string,
  scope: ArtifactScope = 'unknown',
): MarkdownStats {
  return {
    path: filePath,
    name: basename(filePath),
    size: Buffer.byteLength(content, 'utf8'),
    lines: countLines(content),
    tokens: estimateTokens(content),
    headings: countHeadings(content),
    references: extractReferences(content),
    scope,
  };
}

/** Read and analyze a markdown file from disk. */
export async function analyzeMarkdown(
  filePath: string,
  scope: ArtifactScope = 'unknown',
): Promise<MarkdownStats> {
  const content = await readText(filePath);
  return analyzeMarkdownContent(content, filePath, scope);
}
