import { describe, it, expect } from 'vitest';
import {
  analyzeMarkdownContent,
  extractReferences,
  countHeadings,
  detectOverlaps,
  jaccard,
  shingleLines,
  buildTokenReport,
} from './index.js';

const DOC_A = `# Coding standards

Always use strict TypeScript configuration in every project.
Prefer composition over inheritance for shared behaviour.
See [memory](./memory.md) and research.md for details.
`;

const DOC_B = `# Research notes

Always use strict TypeScript configuration in every project.
Prefer composition over inheritance for shared behaviour.
This document adds notes about bioinformatics pipelines.
`;

describe('analyze', () => {
  it('extracts stats from markdown', () => {
    const stats = analyzeMarkdownContent(DOC_A, '/x/coding.md', 'user');
    expect(stats.headings).toBe(1);
    expect(stats.lines).toBeGreaterThan(3);
    expect(stats.tokens).toBeGreaterThan(0);
    expect(stats.references).toContain('./memory.md');
    expect(stats.references).toContain('research.md');
  });

  it('ignores external links in references', () => {
    const refs = extractReferences('[site](https://example.com) and [doc](./a.md)');
    expect(refs).toContain('./a.md');
    expect(refs).not.toContain('https://example.com');
  });

  it('counts headings', () => {
    expect(countHeadings('# a\n## b\ntext\n### c')).toBe(3);
  });
});

describe('overlap', () => {
  it('computes jaccard similarity', () => {
    const a = shingleLines('one common line here\nanother shared sentence');
    const b = shingleLines('one common line here\ntotally different content now');
    expect(jaccard(a, b)).toBeGreaterThan(0);
    expect(jaccard(a, a)).toBe(1);
  });

  it('detects overlapping documents', () => {
    const overlaps = detectOverlaps(
      [
        { path: 'a', content: DOC_A },
        { path: 'b', content: DOC_B },
      ],
      0.1,
    );
    expect(overlaps.length).toBe(1);
    expect(overlaps[0]!.sharedLines).toBeGreaterThanOrEqual(2);
  });
});

describe('token report', () => {
  it('flags large files and overlaps', () => {
    const stats = [
      analyzeMarkdownContent(DOC_A, '/x/coding.md', 'user'),
      analyzeMarkdownContent(DOC_B, '/x/research.md', 'user'),
    ];
    const report = buildTokenReport(
      stats,
      [
        { path: '/x/coding.md', content: DOC_A },
        { path: '/x/research.md', content: DOC_B },
      ],
      { largeFileTokenThreshold: 1, overlapThreshold: 0.1 },
    );
    expect(report.totalFiles).toBe(2);
    expect(report.largeFiles.length).toBe(2);
    expect(report.overlaps.length).toBe(1);
    expect(report.estimatedWastedTokens).toBeGreaterThan(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });
});
