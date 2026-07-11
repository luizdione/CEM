import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  appendAudit,
  readAudit,
  loadHistory,
  recordBackup,
  removeHistoryEntry,
  clearHistory,
  loadConfig,
  type BackupRecord,
} from './index.js';

let dirs: string[] = [];
async function tempEnv(): Promise<{ home: string; platform: 'linux'; env: Record<string, string> }> {
  const home = await mkdtemp(join(tmpdir(), 'cem-hist-'));
  dirs.push(home);
  return { home, platform: 'linux', env: { XDG_CONFIG_HOME: join(home, '.config') } };
}

afterEach(async () => {
  await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
  dirs = [];
});

describe('audit log', () => {
  it('appends and reads entries', async () => {
    const env = await tempEnv();
    await appendAudit({ action: 'scan', ok: true }, env);
    await appendAudit({ action: 'backup', ok: true, message: 'demo.cem' }, env);
    const entries = await readAudit(10, env);
    expect(entries).toHaveLength(2);
    expect(entries[0]!.action).toBe('scan');
    expect(entries[1]!.message).toBe('demo.cem');
    expect(entries[1]!.timestamp).toBeTruthy();
  });

  it('returns empty when no log exists', async () => {
    const env = await tempEnv();
    expect(await readAudit(10, env)).toEqual([]);
  });
});

describe('backup registry', () => {
  const record = (id: string): BackupRecord => ({
    id,
    path: `/backups/${id}.cem`,
    createdAt: new Date().toISOString(),
    encrypted: true,
    fileCount: 10,
    bytes: 2048,
    formatVersion: '1.0.0',
    cemVersion: '1.0.0',
  });

  it('records backups newest-first and updates lastBackupAt', async () => {
    const env = await tempEnv();
    await recordBackup(record('a'), env);
    await recordBackup(record('b'), env);

    const history = await loadHistory(env);
    expect(history.map((r) => r.id)).toEqual(['b', 'a']);

    const config = await loadConfig(undefined, env);
    expect(config.lastBackupAt).toBeTruthy();
  });

  it('removes and clears entries', async () => {
    const env = await tempEnv();
    await recordBackup(record('a'), env);
    await recordBackup(record('b'), env);

    expect(await removeHistoryEntry('a', env)).toBe(true);
    expect(await removeHistoryEntry('missing', env)).toBe(false);
    expect((await loadHistory(env)).map((r) => r.id)).toEqual(['b']);

    await clearHistory(env);
    expect(await loadHistory(env)).toEqual([]);
  });
});
