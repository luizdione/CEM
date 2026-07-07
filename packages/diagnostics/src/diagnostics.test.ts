import { describe, it, expect } from 'vitest';
import { runDiagnostics, tokenRollup } from './index.js';
import type { McpServerDefinition, ScannedArtifact } from '@cem/core';

function art(over: Partial<ScannedArtifact>): ScannedArtifact {
  return {
    id: over.id ?? 'id',
    kind: over.kind ?? 'markdown',
    scope: over.scope ?? 'user',
    path: over.path ?? '/x',
    name: over.name ?? 'x',
    size: over.size ?? 10,
    mtimeMs: 0,
    ...over,
  };
}

describe('runDiagnostics', () => {
  it('flags an empty environment', () => {
    const report = runDiagnostics({ artifacts: [] });
    expect(report.diagnostics.some((d) => d.id === 'env-empty')).toBe(true);
  });

  it('detects broken MCP configs', () => {
    const servers: McpServerDefinition[] = [
      { name: 'a', transport: 'stdio', scope: 'user', sourcePath: '/c' },
      { name: 'b', transport: 'http', scope: 'user', sourcePath: '/c' },
    ];
    const report = runDiagnostics({ artifacts: [art({})], mcpServers: servers });
    expect(report.summary.errors).toBe(2);
    expect(report.summary.healthy).toBe(false);
  });

  it('detects duplicates by hash', () => {
    const report = runDiagnostics({
      artifacts: [
        art({ id: '1', path: '/a', sha256: 'deadbeef' }),
        art({ id: '2', path: '/b', sha256: 'deadbeef' }),
      ],
    });
    expect(report.diagnostics.some((d) => d.category === 'duplicate')).toBe(true);
  });

  it('flags token-heavy files', () => {
    const report = runDiagnostics({
      artifacts: [art({ id: 'big', tokens: 9000, name: 'big.md' })],
      largeFileTokenThreshold: 6000,
    });
    expect(report.diagnostics.some((d) => d.category === 'tokens')).toBe(true);
  });

  it('reports missing references as orphans', () => {
    const report = runDiagnostics({
      artifacts: [art({})],
      missingReferences: [{ from: '/x/a.md', reference: './missing.md' }],
    });
    expect(report.diagnostics.some((d) => d.category === 'orphan')).toBe(true);
  });
});

describe('tokenRollup', () => {
  it('aggregates tokens by kind and scope', () => {
    const rollup = tokenRollup([
      art({ kind: 'skill', scope: 'user', tokens: 100 }),
      art({ kind: 'skill', scope: 'project', tokens: 50 }),
      art({ kind: 'memory', scope: 'user', tokens: 25 }),
    ]);
    expect(rollup.total).toBe(175);
    expect(rollup.byKind.skill).toBe(150);
    expect(rollup.byScope.user).toBe(125);
  });
});
