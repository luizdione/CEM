import { execFile } from 'node:child_process';
import { dirname } from 'node:path';
import { ensureDir, pathExists } from '@cem/shared';
import type { SyncResult, SyncStatus } from './types.js';

/**
 * Commit identity used ONLY for CEM's own sync commits, passed inline so we
 * never mutate the user's global git config.
 */
const IDENTITY = [
  '-c',
  'user.email=cem@localhost',
  '-c',
  'user.name=Claude Environment Manager',
];

interface GitRun {
  readonly ok: boolean;
  readonly stdout: string;
  readonly stderr: string;
}

function runGit(cwd: string, args: string[]): Promise<GitRun> {
  return new Promise((resolve) => {
    execFile('git', args, { cwd, maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({
        ok: !err,
        stdout: (stdout ?? '').toString(),
        stderr: (stderr ?? '').toString(),
      });
    });
  });
}

async function branchOf(dir: string): Promise<string> {
  const r = await runGit(dir, ['rev-parse', '--abbrev-ref', 'HEAD']);
  return r.ok && r.stdout.trim() ? r.stdout.trim() : 'main';
}

/**
 * Git-based synchronization for a CEM backup directory. Every operation is
 * EXPLICIT — nothing is ever pushed automatically. CEM performs no credential
 * handling; pushing/pulling uses the user's existing git configuration.
 */
export class GitSyncProvider {
  readonly id = 'git' as const;
  readonly label = 'Git';

  async isRepo(dir: string): Promise<boolean> {
    if (!(await pathExists(dir))) return false;
    const r = await runGit(dir, ['rev-parse', '--is-inside-work-tree']);
    return r.ok && r.stdout.trim() === 'true';
  }

  /** Initialize a repo in `dir` and optionally set the `origin` remote. */
  async init(dir: string, options: { remote?: string; branch?: string } = {}): Promise<SyncResult> {
    const branch = options.branch ?? 'main';
    await ensureDir(dir);

    if (!(await this.isRepo(dir))) {
      const init = await runGit(dir, ['init', '-b', branch]);
      if (!init.ok) return fail('init', init.stderr);
    }
    if (options.remote) {
      const existing = await runGit(dir, ['remote', 'get-url', 'origin']);
      const args = existing.ok
        ? ['remote', 'set-url', 'origin', options.remote]
        : ['remote', 'add', 'origin', options.remote];
      const r = await runGit(dir, args);
      if (!r.ok) return fail('init', r.stderr);
    }
    return { ok: true, action: 'init', message: `Initialized git sync in ${dir}` };
  }

  async status(dir: string): Promise<SyncStatus> {
    if (!(await this.isRepo(dir))) {
      return { provider: 'git', path: dir, isRepo: false, dirty: false, ahead: 0, behind: 0 };
    }

    const branch = await branchOf(dir);
    const remote = await runGit(dir, ['remote', 'get-url', 'origin']);
    const porcelain = await runGit(dir, ['status', '--porcelain']);
    const counts = await runGit(dir, ['rev-list', '--left-right', '--count', '@{upstream}...HEAD']);
    const [behind = '0', ahead = '0'] = counts.ok ? counts.stdout.trim().split(/\s+/) : [];

    const hash = (await runGit(dir, ['log', '-1', '--pretty=%H'])).stdout.trim();
    let lastCommit: SyncStatus['lastCommit'];
    if (hash) {
      const message = (await runGit(dir, ['log', '-1', '--pretty=%s'])).stdout.trim();
      const date = (await runGit(dir, ['log', '-1', '--pretty=%cI'])).stdout.trim();
      lastCommit = { hash, message, date };
    }

    return {
      provider: 'git',
      path: dir,
      isRepo: true,
      branch,
      ...(remote.ok ? { remoteUrl: remote.stdout.trim() } : {}),
      dirty: porcelain.stdout.trim().length > 0,
      ahead: Number(ahead) || 0,
      behind: Number(behind) || 0,
      ...(lastCommit ? { lastCommit } : {}),
    };
  }

  /** Stage everything, commit, and (optionally) push. Explicit only. */
  async commitAndPush(
    dir: string,
    message: string,
    options: { push?: boolean } = {},
  ): Promise<SyncResult> {
    if (!(await this.isRepo(dir))) return fail('push', 'Not a git repository. Run init first.');

    await runGit(dir, ['add', '-A']);
    const porcelain = await runGit(dir, ['status', '--porcelain']);
    let committed = false;
    if (porcelain.stdout.trim().length > 0) {
      const commit = await runGit(dir, [...IDENTITY, 'commit', '-m', message]);
      if (!commit.ok) return fail('push', commit.stderr || 'commit failed');
      committed = true;
    }

    const hasRemote = (await runGit(dir, ['remote', 'get-url', 'origin'])).ok;
    if (!options.push || !hasRemote) {
      return {
        ok: true,
        action: 'push',
        committed,
        pushed: false,
        message: committed
          ? 'Committed locally' + (hasRemote ? ' (push skipped)' : ' (no remote configured)')
          : 'Nothing to commit',
      };
    }

    const branch = await branchOf(dir);
    const push = await runGit(dir, ['push', '-u', 'origin', branch]);
    if (!push.ok) return { ok: false, action: 'push', committed, pushed: false, message: push.stderr };
    return { ok: true, action: 'push', committed, pushed: true, message: `Pushed to origin/${branch}` };
  }

  /** Pull from the configured remote. */
  async pull(dir: string): Promise<SyncResult> {
    if (!(await this.isRepo(dir))) return fail('pull', 'Not a git repository.');
    const branch = await branchOf(dir);
    const pull = await runGit(dir, ['pull', 'origin', branch]);
    return pull.ok
      ? { ok: true, action: 'pull', message: pull.stdout.trim() || 'Up to date' }
      : fail('pull', pull.stderr);
  }

  /** Clone an existing backup repository into `dir`. */
  async clone(remote: string, dir: string): Promise<SyncResult> {
    await ensureDir(dirname(dir));
    const clone = await runGit(dirname(dir), ['clone', remote, dir]);
    return clone.ok
      ? { ok: true, action: 'clone', message: `Cloned into ${dir}` }
      : fail('clone', clone.stderr);
  }
}

function fail(action: string, message: string): SyncResult {
  return { ok: false, action, message: message.trim() || `${action} failed` };
}

/** Shared default instance. */
export const gitProvider = new GitSyncProvider();
