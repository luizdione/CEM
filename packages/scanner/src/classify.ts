import { extname } from 'node:path';
import type { ArtifactKind } from '@cem/shared';

/** File extensions CEM treats as text (safe to read for token estimation). */
export const TEXT_EXTENSIONS = new Set([
  '.md',
  '.markdown',
  '.mdx',
  '.json',
  '.jsonc',
  '.json5',
  '.yaml',
  '.yml',
  '.toml',
  '.txt',
  '.ini',
  '.cfg',
  '.conf',
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.mts',
  '.cts',
  '.py',
  '.sh',
]);

/** Largest file (bytes) CEM will read into memory to estimate tokens. */
export const MAX_TEXT_READ_BYTES = 2 * 1024 * 1024;

export function isTextFile(filePath: string): boolean {
  return TEXT_EXTENSIONS.has(extname(filePath).toLowerCase());
}

/**
 * Refine an artifact kind based on the concrete file. A skills directory keeps
 * the `skill` kind for all children; a stray `.md` in a generic location is
 * classified as markdown/memory.
 */
export function refineKind(baseKind: ArtifactKind, fileName: string): ArtifactKind {
  const lower = fileName.toLowerCase();
  const ext = extname(lower);

  if (baseKind === 'skill' || baseKind === 'agent' || baseKind === 'command') {
    return baseKind;
  }
  if (baseKind === 'plugin' || baseKind === 'project') {
    return baseKind;
  }
  if (lower === 'claude.md' || lower === 'claude.local.md' || lower.includes('memory')) {
    return 'memory';
  }
  if (ext === '.md' || ext === '.markdown' || ext === '.mdx') {
    if (lower.includes('prompt')) return 'prompt';
    if (lower.includes('template')) return 'template';
    return 'markdown';
  }
  if (ext === '.json' || ext === '.jsonc' || ext === '.yaml' || ext === '.yml' || ext === '.toml') {
    return baseKind === 'unknown' ? 'config' : baseKind;
  }
  return baseKind;
}
