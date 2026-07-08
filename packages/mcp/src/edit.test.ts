import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseMcpServers,
  exportServers,
  importServers,
  upsertServers,
  setServerDisabled,
  removeServer,
} from './index.js';

const SERVERS = parseMcpServers(
  {
    mcpServers: {
      filesystem: { command: 'npx', args: ['-y', 'server-fs'], env: { KEY: 'v' } },
      remote: { type: 'http', url: 'https://example.com/mcp' },
    },
  },
  '/src.json',
  'user',
);

let dirs: string[] = [];
async function tmp(): Promise<string> {
  const d = await mkdtemp(join(tmpdir(), 'cem-mcpedit-'));
  dirs.push(d);
  return d;
}
afterEach(async () => {
  await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
  dirs = [];
});

describe('export/import round-trip', () => {
  it('exports servers to mcp.json and imports them back', async () => {
    const dir = await tmp();
    const file = join(dir, 'mcp.json');
    await exportServers(SERVERS, file);

    const doc = JSON.parse(await readFile(file, 'utf8'));
    expect(Object.keys(doc.mcpServers)).toEqual(['filesystem', 'remote']);

    const imported = await importServers(file, 'project');
    expect(imported.map((s) => s.name).sort()).toEqual(['filesystem', 'remote']);
    expect(imported.find((s) => s.name === 'remote')?.transport).toBe('http');
  });
});

describe('upsertServers', () => {
  it('adds new servers and preserves other config keys', async () => {
    const dir = await tmp();
    const file = join(dir, 'settings.json');
    await import('node:fs/promises').then((fs) =>
      fs.writeFile(file, JSON.stringify({ theme: 'dark' })),
    );

    const res = await upsertServers(file, SERVERS);
    expect(res.added).toBe(2);

    const doc = JSON.parse(await readFile(file, 'utf8'));
    expect(doc.theme).toBe('dark'); // preserved
    expect(Object.keys(doc.mcpServers)).toEqual(['filesystem', 'remote']);
  });

  it('skips existing servers unless overwrite is set', async () => {
    const dir = await tmp();
    const file = join(dir, 'mcp.json');
    await upsertServers(file, SERVERS);

    const skip = await upsertServers(file, SERVERS);
    expect(skip).toMatchObject({ added: 0, updated: 0, skipped: 2 });

    const over = await upsertServers(file, SERVERS, { overwrite: true });
    expect(over.updated).toBe(2);
  });
});

describe('enable/disable and remove', () => {
  it('toggles the disabled flag', async () => {
    const dir = await tmp();
    const file = join(dir, 'mcp.json');
    await upsertServers(file, SERVERS);

    expect(await setServerDisabled(file, 'filesystem', true)).toBe(true);
    let doc = JSON.parse(await readFile(file, 'utf8'));
    expect(doc.mcpServers.filesystem.disabled).toBe(true);

    await setServerDisabled(file, 'filesystem', false);
    doc = JSON.parse(await readFile(file, 'utf8'));
    expect(doc.mcpServers.filesystem.disabled).toBeUndefined();

    expect(await setServerDisabled(file, 'nope', true)).toBe(false);
  });

  it('removes a server', async () => {
    const dir = await tmp();
    const file = join(dir, 'mcp.json');
    await upsertServers(file, SERVERS);

    expect(await removeServer(file, 'remote')).toBe(true);
    const doc = JSON.parse(await readFile(file, 'utf8'));
    expect(Object.keys(doc.mcpServers)).toEqual(['filesystem']);
    expect(await removeServer(file, 'remote')).toBe(false);
  });
});
