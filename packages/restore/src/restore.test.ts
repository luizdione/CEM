import { describe, it, expect } from 'vitest';
import { computeRestoreTargets, resolveTarget } from './restore.js';
import type { CemArchive } from './read.js';
import type { CemEntry } from '@cem/core';

function entry(archivePath: string): CemEntry {
  return {
    archivePath,
    kind: 'markdown',
    scope: 'user',
    size: 1,
    sha256: 'x',
    restore: { base: 'home', relative: archivePath.replace('markdown/', '.claude/') },
  };
}

const archive: CemArchive = {
  manifest: {} as CemArchive['manifest'],
  entries: [entry('markdown/a.md'), entry('markdown/b.md')],
  checksums: {},
  config: null,
  files: { 'markdown/a.md': new Uint8Array([1]), 'markdown/b.md': new Uint8Array([2]) },
  encrypted: false,
};

describe('selective restore', () => {
  it('restores only the chosen archive paths', async () => {
    const plan = await computeRestoreTargets(archive, {
      home: '/tmp/does-not-exist-cem',
      archivePaths: ['markdown/a.md'],
    });
    expect(plan).toHaveLength(1);
    expect(plan[0]!.entry.archivePath).toBe('markdown/a.md');
  });

  it('restores everything when no selection is given', async () => {
    const plan = await computeRestoreTargets(archive, { home: '/tmp/does-not-exist-cem' });
    expect(plan).toHaveLength(2);
  });

  it('resolves home-based targets', () => {
    expect(resolveTarget(entry('markdown/a.md'), { home: '/home/u' })).toBe('/home/u/.claude/a.md');
  });
});
