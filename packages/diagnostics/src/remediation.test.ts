import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathExists } from '@cem/shared';
import { proposeRemediations, applyRemediation } from './index.js';
import type { DiagnosticReport } from './index.js';

let dirs: string[] = [];
async function tmp(): Promise<{ dir: string; env: { home: string; platform: 'linux'; env: Record<string, string> } }> {
  const dir = await mkdtemp(join(tmpdir(), 'cem-remed-'));
  dirs.push(dir);
  return { dir, env: { home: dir, platform: 'linux', env: { XDG_CONFIG_HOME: join(dir, '.config') } } };
}
afterEach(async () => {
  await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
  dirs = [];
});

function report(diagnostics: DiagnosticReport['diagnostics']): DiagnosticReport {
  return {
    generatedAt: 'now',
    diagnostics,
    summary: { errors: 0, warnings: 0, infos: 0, healthy: true },
  };
}

describe('proposeRemediations', () => {
  it('proposes removal for a broken MCP server', () => {
    const rems = proposeRemediations(
      report([
        {
          id: 'mcp-nocommand-foo',
          severity: 'error',
          category: 'mcp',
          message: 'broken',
          path: '/cfg/settings.json',
          details: { server: 'foo' },
        },
      ]),
    );
    expect(rems).toHaveLength(1);
    expect(rems[0]!.automatic).toBe(true);
    expect(rems[0]!.action).toMatchObject({ type: 'remove-mcp-server', name: 'foo' });
  });

  it('marks nested-config MCP problems as manual', () => {
    const rems = proposeRemediations(
      report([
        {
          id: 'mcp-nocommand-bar',
          severity: 'error',
          category: 'mcp',
          message: 'broken',
          path: '/home/.claude.json#/proj',
          details: { server: 'bar' },
        },
      ]),
    );
    expect(rems[0]!.automatic).toBe(false);
  });

  it('proposes de-duplication and a stub for orphan references', () => {
    const rems = proposeRemediations(
      report([
        { id: 'dup-1', severity: 'warning', category: 'duplicate', message: 'dupes', details: { paths: ['/a', '/b'] } },
        { id: 'orphan-1', severity: 'warning', category: 'orphan', message: 'missing', path: '/docs/x.md', details: { reference: './missing.md' } },
      ]),
    );
    expect(rems.find((r) => r.action.type === 'delete-duplicates')).toBeTruthy();
    expect(rems.find((r) => r.action.type === 'create-stub')).toBeTruthy();
  });
});

describe('applyRemediation', () => {
  it('removes a broken MCP server and backs up the config', async () => {
    const { dir, env } = await tmp();
    const cfg = join(dir, 'settings.json');
    await writeFile(cfg, JSON.stringify({ theme: 'dark', mcpServers: { foo: { type: 'http' } } }));

    const [rem] = proposeRemediations(
      report([
        { id: 'mcp-nourl-foo', severity: 'error', category: 'mcp', message: 'x', path: cfg, details: { server: 'foo' } },
      ]),
    );
    const res = await applyRemediation(rem!, env);
    expect(res.applied).toBe(true);
    expect(res.backup?.length).toBe(1);

    const after = JSON.parse(await readFile(cfg, 'utf8'));
    expect(after.mcpServers.foo).toBeUndefined();
    expect(after.theme).toBe('dark'); // preserved
    expect(await pathExists(res.backup![0]!)).toBe(true); // backup exists
  });

  it('deletes duplicates but keeps the first, backing up removed files', async () => {
    const { dir, env } = await tmp();
    const a = join(dir, 'a.md');
    const b = join(dir, 'b.md');
    await writeFile(a, 'same');
    await writeFile(b, 'same');

    const [rem] = proposeRemediations(
      report([{ id: 'dup-x', severity: 'warning', category: 'duplicate', message: 'd', details: { paths: [a, b] } }]),
    );
    const res = await applyRemediation(rem!, env);
    expect(res.applied).toBe(true);
    expect(await pathExists(a)).toBe(true); // kept
    expect(await pathExists(b)).toBe(false); // removed
    expect(res.backup?.length).toBe(1);
  });

  it('creates a stub for a missing reference', async () => {
    const { dir, env } = await tmp();
    const target = join(dir, 'missing.md');
    const [rem] = proposeRemediations(
      report([
        { id: 'orphan-y', severity: 'warning', category: 'orphan', message: 'm', path: join(dir, 'x.md'), details: { reference: './missing.md' } },
      ]),
    );
    const res = await applyRemediation(rem!, env);
    expect(res.applied).toBe(true);
    expect(await pathExists(target)).toBe(true);
  });
});
