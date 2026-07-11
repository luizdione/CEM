import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitProvider } from './index.js';

let dirs: string[] = [];
async function tmp(prefix: string): Promise<string> {
  const d = await mkdtemp(join(tmpdir(), prefix));
  dirs.push(d);
  return d;
}
afterEach(async () => {
  await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
  dirs = [];
});

describe('GitSyncProvider', () => {
  it('reports non-repo status for a plain directory', async () => {
    const dir = await tmp('cem-sync-plain-');
    const status = await gitProvider.status(dir);
    expect(status.isRepo).toBe(false);
    expect(await gitProvider.isRepo(dir)).toBe(false);
  });

  it('commits locally without a remote', async () => {
    const dir = await tmp('cem-sync-local-');
    await gitProvider.init(dir);
    await writeFile(join(dir, 'backup.cem'), 'data');
    const res = await gitProvider.commitAndPush(dir, 'first backup', { push: true });
    expect(res.ok).toBe(true);
    expect(res.committed).toBe(true);
    expect(res.pushed).toBe(false); // no remote configured

    const again = await gitProvider.commitAndPush(dir, 'noop', { push: true });
    expect(again.committed).toBe(false); // nothing to commit
  });

  it('initializes, commits, pushes to a bare remote, and clones back', async () => {
    const remoteHome = await tmp('cem-sync-remote-');
    const remote = join(remoteHome, 'backups.git');
    execFileSync('git', ['init', '--bare', '-b', 'main', remote]);

    const work = await tmp('cem-sync-work-');
    await gitProvider.init(work, { remote, branch: 'main' });
    await writeFile(join(work, 'env.cem'), 'encrypted-backup-bytes');

    const push = await gitProvider.commitAndPush(work, 'backup env', { push: true });
    expect(push.ok).toBe(true);
    expect(push.pushed).toBe(true);

    const status = await gitProvider.status(work);
    expect(status.isRepo).toBe(true);
    expect(status.branch).toBe('main');
    expect(status.remoteUrl).toContain('backups.git');
    expect(status.lastCommit?.message).toBe('backup env');
    expect(status.dirty).toBe(false);

    const cloneHome = await tmp('cem-sync-clone-');
    const cloneDir = join(cloneHome, 'restored');
    const clone = await gitProvider.clone(remote, cloneDir);
    expect(clone.ok).toBe(true);
    expect(await readFile(join(cloneDir, 'env.cem'), 'utf8')).toBe('encrypted-backup-bytes');
  });
});
