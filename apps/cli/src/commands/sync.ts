import type { Command } from 'commander';
import { getCemBackupsDir } from '@cem/core';
import { gitProvider } from '@cem/sync';
import { ui, formatError, printJson, confirm } from '../ui.js';

function resolveDir(dir?: string): string {
  return dir ?? getCemBackupsDir();
}

export function registerSync(program: Command): void {
  const sync = program
    .command('sync')
    .description('Optional Git synchronization of your backups (never automatic)');

  sync
    .command('status')
    .description('Show sync status of the backups directory')
    .argument('[dir]', 'Directory (default: ~/CEM Backups)')
    .option('--json', 'Output JSON', false)
    .action(async (dir: string | undefined, opts: { json?: boolean }) => {
      try {
        const status = await gitProvider.status(resolveDir(dir));
        if (opts.json) return printJson(status);
        ui.heading('Git sync status');
        ui.kv('Directory', status.path);
        ui.kv('Repository', status.isRepo ? 'yes' : 'no (run "cem sync init")');
        if (status.isRepo) {
          ui.kv('Branch', status.branch ?? '—');
          ui.kv('Remote', status.remoteUrl ?? 'none');
          ui.kv('Uncommitted', status.dirty ? 'yes' : 'no');
          ui.kv('Ahead / behind', `${status.ahead} / ${status.behind}`);
          if (status.lastCommit) ui.kv('Last commit', status.lastCommit.message);
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });

  sync
    .command('init')
    .description('Initialize Git sync in the backups directory')
    .argument('[dir]', 'Directory (default: ~/CEM Backups)')
    .option('--remote <url>', 'Set the origin remote (e.g. git@github.com:you/cem-backups.git)')
    .action(async (dir: string | undefined, opts: { remote?: string }) => {
      try {
        const res = await gitProvider.init(resolveDir(dir), opts.remote ? { remote: opts.remote } : {});
        if (res.ok) ui.success(res.message);
        else {
          ui.error(res.message);
          process.exitCode = 1;
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });

  sync
    .command('push')
    .description('Commit and push the backups directory (explicit)')
    .argument('[dir]', 'Directory (default: ~/CEM Backups)')
    .option('-m, --message <msg>', 'Commit message', 'CEM backup sync')
    .option('--no-push', 'Commit locally only, do not push')
    .option('-y, --yes', 'Skip the upload confirmation', false)
    .action(
      async (dir: string | undefined, opts: { message: string; push?: boolean; yes?: boolean }) => {
        try {
          const target = resolveDir(dir);
          if (opts.push !== false && !opts.yes) {
            ui.warn('Pushing uploads your .cem backups to the configured remote.');
            ui.warn('Encrypt sensitive backups first. This is never done automatically.');
            const proceed = await confirm('Continue with push?');
            if (!proceed) {
              ui.warn('Cancelled.');
              return;
            }
          }
          const res = await gitProvider.commitAndPush(target, opts.message, {
            push: opts.push !== false,
          });
          if (res.ok) ui.success(res.message);
          else {
            ui.error(res.message);
            process.exitCode = 1;
          }
        } catch (error) {
          ui.error(formatError(error));
          process.exitCode = 1;
        }
      },
    );

  sync
    .command('pull')
    .description('Pull backups from the configured remote')
    .argument('[dir]', 'Directory (default: ~/CEM Backups)')
    .action(async (dir: string | undefined) => {
      try {
        const res = await gitProvider.pull(resolveDir(dir));
        if (res.ok) ui.success(res.message || 'Up to date');
        else {
          ui.error(res.message);
          process.exitCode = 1;
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });

  sync
    .command('clone')
    .description('Clone an existing backup repository')
    .argument('<remote>', 'Remote URL')
    .argument('<dir>', 'Destination directory')
    .action(async (remote: string, dir: string) => {
      try {
        const res = await gitProvider.clone(remote, dir);
        if (res.ok) ui.success(res.message);
        else {
          ui.error(res.message);
          process.exitCode = 1;
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}
