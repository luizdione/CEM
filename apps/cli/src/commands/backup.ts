import { basename, dirname } from 'node:path';
import type { Command } from 'commander';
import type { ScannedArtifact } from '@cem/core';
import { createLogger } from '@cem/shared';
import { backupEnvironment } from '@cem/backup';
import { loadProfiles, matchesProfile } from '@cem/profiles';
import { ui, printJson, formatError, resolvePassword } from '../ui.js';
import { CEM_VERSION } from '../version.js';

interface BackupCliOptions {
  out?: string;
  name?: string;
  encrypt?: boolean;
  password?: string;
  profile?: string;
  includeProjects?: boolean;
  notes?: string;
  home?: string;
  json?: boolean;
}

async function runBackup(opts: BackupCliOptions, defaults: { encrypt: boolean }): Promise<void> {
  const wantsEncryption = opts.encrypt ?? defaults.encrypt;
  const password = wantsEncryption
    ? await resolvePassword(opts.password, { prompt: true })
    : undefined;

  if (wantsEncryption && !password) {
    ui.error('Encryption requested but no password provided (use --password or CEM_PASSWORD).');
    process.exitCode = 1;
    return;
  }

  let filter: ((a: ScannedArtifact) => boolean) | undefined;
  let profileName: string | undefined;
  if (opts.profile) {
    const profiles = await loadProfiles();
    const profile = profiles.find(
      (p) => p.id === opts.profile || p.name.toLowerCase() === opts.profile!.toLowerCase(),
    );
    if (!profile) {
      ui.error(`Profile "${opts.profile}" not found. Run "cem profiles list".`);
      process.exitCode = 1;
      return;
    }
    profileName = profile.name;
    filter = (a) => matchesProfile(a, profile);
  }

  const logger = createLogger({ capture: true, silent: true });

  const result = await backupEnvironment({
    ...(opts.home ? { home: opts.home } : {}),
    ...(opts.out ? { outDir: opts.out } : {}),
    ...(opts.name ? { fileName: opts.name } : {}),
    ...(password ? { password } : {}),
    ...(opts.notes ? { notes: opts.notes } : {}),
    ...(profileName ? { profilesIncluded: [profileName] } : {}),
    ...(filter ? { filter } : {}),
    includeProjectHistory: Boolean(opts.includeProjects),
    cemVersion: CEM_VERSION,
    logger,
  });

  if (opts.json) {
    printJson({ path: result.path, ...result.manifest, skipped: result.skipped });
    return;
  }

  ui.heading('Backup created');
  ui.kv('File', result.path);
  ui.kv('Size', ui.bytes(result.bytes));
  ui.kv('Files', ui.num(result.fileCount));
  ui.kv('Encrypted', result.encrypted ? 'yes (AES-256-GCM)' : 'no');
  if (profileName) ui.kv('Profile', profileName);
  if (result.skipped.length > 0) ui.warn(`${result.skipped.length} file(s) were skipped.`);
  console.log();
  ui.success('Done. Store this .cem file somewhere safe.');
}

export function registerBackup(program: Command): void {
  program
    .command('backup')
    .description('Create a full .cem backup of the Claude environment')
    .option('--out <dir>', 'Output directory')
    .option('--name <file>', 'Output file name')
    .option('--encrypt', 'Encrypt the backup with a password', false)
    .option('--password <pw>', 'Password for encryption (or set CEM_PASSWORD)')
    .option('--profile <name>', 'Only include artifacts matching a profile')
    .option('--include-projects', 'Include ~/.claude/projects history', false)
    .option('--notes <text>', 'Attach a note to the backup')
    .option('--home <dir>', 'Override the home directory')
    .option('--json', 'Output JSON', false)
    .action(async (opts: BackupCliOptions) => {
      try {
        await runBackup(opts, { encrypt: false });
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });

  program
    .command('export')
    .description('Export the environment to a portable .cem file (alias of backup)')
    .argument('[file]', 'Destination .cem file path')
    .option('--encrypt', 'Encrypt the export', false)
    .option('--password <pw>', 'Password for encryption (or set CEM_PASSWORD)')
    .option('--profile <name>', 'Only include artifacts matching a profile')
    .option('--home <dir>', 'Override the home directory')
    .option('--json', 'Output JSON', false)
    .action(async (file: string | undefined, opts: BackupCliOptions) => {
      try {
        const mapped: BackupCliOptions = {
          ...opts,
          ...(file ? { out: dirname(file), name: basename(file) } : {}),
        };
        await runBackup(mapped, { encrypt: false });
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}
