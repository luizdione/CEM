import type { Command } from 'commander';
import { readManifest, readCemArchive, verifyArchive } from '@cem/restore';
import { ui, printJson, formatError, resolvePassword } from '../ui.js';

export function registerVerify(program: Command): void {
  program
    .command('verify')
    .description('Verify the integrity of a .cem archive')
    .argument('<file>', 'Path to the .cem archive')
    .option('--password <pw>', 'Password for an encrypted archive (or set CEM_PASSWORD)')
    .option('--json', 'Output JSON', false)
    .action(async (file: string, opts: { password?: string; json?: boolean }) => {
      try {
        const manifest = await readManifest(file);
        const password = manifest.encryption.enabled
          ? await resolvePassword(opts.password, { prompt: true })
          : undefined;
        if (manifest.encryption.enabled && !password) {
          ui.error('This archive is encrypted. Provide --password or set CEM_PASSWORD.');
          process.exitCode = 1;
          return;
        }

        const archive = await readCemArchive(file, password);
        const result = verifyArchive(archive);

        if (opts.json) {
          printJson({ manifest, verification: result });
          return;
        }

        ui.heading('Archive verification');
        ui.kv('Archive', file);
        ui.kv('Format', manifest.formatVersion);
        ui.kv('Created by CEM', manifest.cemVersion);
        ui.kv('Created at', manifest.createdAt);
        ui.kv('Total files', String(manifest.contents.totalFiles));
        ui.kv('Verified', String(result.verified));
        ui.kv('Mismatches', String(result.mismatches.length));
        ui.kv('Missing', String(result.missing.length));
        console.log();
        if (result.ok) ui.success('Integrity OK — every file matches its checksum.');
        else ui.error('Integrity check FAILED.');
        process.exitCode = result.ok ? 0 : 1;
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}
