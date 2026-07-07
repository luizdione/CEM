import type { Command } from 'commander';
import type { ArtifactKind } from '@cem/core';
import {
  readManifest,
  readCemArchive,
  verifyArchive,
  computeRestoreTargets,
  restoreArchive,
} from '@cem/restore';
import { ui, printJson, formatError, resolvePassword, confirm } from '../ui.js';

interface RestoreCliOptions {
  home?: string;
  password?: string;
  dryRun?: boolean;
  overwrite?: boolean;
  kinds?: string;
  projectDir?: string;
  externalDir?: string;
  force?: boolean;
  yes?: boolean;
  json?: boolean;
}

function parseKinds(value?: string): ArtifactKind[] | undefined {
  if (!value) return undefined;
  return value
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean) as ArtifactKind[];
}

async function runRestore(file: string, opts: RestoreCliOptions): Promise<void> {
  const manifest = await readManifest(file);
  const kinds = parseKinds(opts.kinds);

  const password = manifest.encryption.enabled
    ? await resolvePassword(opts.password, { prompt: true })
    : undefined;
  if (manifest.encryption.enabled && !password) {
    ui.error('This archive is encrypted. Provide --password or set CEM_PASSWORD.');
    process.exitCode = 1;
    return;
  }

  const archive = await readCemArchive(file, password);
  const verification = verifyArchive(archive);

  const restoreOptions = {
    ...(opts.home ? { home: opts.home } : {}),
    ...(kinds ? { kinds } : {}),
    ...(opts.projectDir ? { projectBaseDir: opts.projectDir } : {}),
    ...(opts.externalDir ? { externalBaseDir: opts.externalDir } : {}),
    overwrite: Boolean(opts.overwrite),
  };

  const plan = await computeRestoreTargets(archive, restoreOptions);
  const conflicts = plan.filter((p) => p.exists).length;

  if (!opts.json) {
    ui.heading('Restore plan');
    ui.kv('Archive', file);
    ui.kv('Created', manifest.createdAt);
    ui.kv('Source OS', manifest.host.os);
    ui.kv('Encrypted', manifest.encryption.enabled ? 'yes' : 'no');
    ui.kv('Integrity', verification.ok ? 'verified' : 'FAILED');
    ui.kv('Files to restore', String(plan.length));
    ui.kv('Existing (conflicts)', String(conflicts));
  }

  if (!verification.ok && !opts.force) {
    ui.error('Integrity verification failed. Use --force to override (not recommended).');
    if (opts.json)
      printJson({ ok: false, verification, restored: [] });
    process.exitCode = 1;
    return;
  }

  if (opts.dryRun) {
    if (opts.json) printJson({ dryRun: true, plan: plan.map((p) => p.targetPath), conflicts });
    else {
      console.log();
      ui.info('Dry run — nothing was written.');
      for (const item of plan.slice(0, 20)) {
        ui.item(`${item.exists ? ui.dim('[exists] ') : ''}${item.targetPath}`);
      }
    }
    return;
  }

  if (!opts.yes && !opts.json) {
    const proceed = await confirm('Proceed with restore?');
    if (!proceed) {
      ui.warn('Cancelled.');
      return;
    }
  }

  const result = await restoreArchive(archive, restoreOptions);

  if (opts.json) {
    printJson({ ok: true, verification, ...result });
    return;
  }

  console.log();
  ui.success(`Restored ${result.restored.length} file(s).`);
  if (result.conflicts.length > 0) {
    ui.warn(`${result.conflicts.length} file(s) skipped (already exist). Use --overwrite to replace.`);
  }
}

export function registerRestore(program: Command): void {
  const configure = (cmd: Command): Command =>
    cmd
      .argument('<file>', 'Path to the .cem archive')
      .option('--home <dir>', 'Target home directory')
      .option('--password <pw>', 'Password for an encrypted archive (or set CEM_PASSWORD)')
      .option('--kinds <list>', 'Comma-separated artifact kinds to restore (e.g. skill,agent)')
      .option('--project-dir <dir>', 'Base directory for project-scoped files')
      .option('--external-dir <dir>', 'Base directory for external/absolute files')
      .option('--overwrite', 'Overwrite files that already exist', false)
      .option('--dry-run', 'Show the plan without writing', false)
      .option('--force', 'Restore even if integrity verification fails', false)
      .option('-y, --yes', 'Do not prompt for confirmation', false)
      .option('--json', 'Output JSON', false);

  configure(program.command('restore').description('Restore a .cem archive')).action(
    async (file: string, opts: RestoreCliOptions) => {
      try {
        await runRestore(file, opts);
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    },
  );

  configure(
    program.command('import').description('Import (restore) a .cem archive (alias of restore)'),
  ).action(async (file: string, opts: RestoreCliOptions) => {
    try {
      await runRestore(file, opts);
    } catch (error) {
      ui.error(formatError(error));
      process.exitCode = 1;
    }
  });
}
