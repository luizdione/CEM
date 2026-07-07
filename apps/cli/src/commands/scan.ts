import type { Command } from 'commander';
import { scanEnvironment, countByKind, totalTokens, totalBytes } from '@cem/scanner';
import { ui, printJson, printCounts, formatError } from '../ui.js';

export function registerScan(program: Command): void {
  program
    .command('scan')
    .description('Scan the machine for Claude Code artifacts (read-only)')
    .option('--home <dir>', 'Override the home directory to scan')
    .option('--projects', 'Also auto-discover and scan project roots', false)
    .option('--no-tokens', 'Skip token estimation (faster)')
    .option('--json', 'Output JSON', false)
    .action(async (opts) => {
      try {
        const result = await scanEnvironment({
          ...(opts.home ? { home: opts.home } : {}),
          discoverProjects: Boolean(opts.projects),
          computeTokens: opts.tokens !== false,
        });

        if (opts.json) {
          printJson(result);
          return;
        }

        ui.heading('Claude Environment Scan');
        ui.kv('Scanned at', result.scannedAt);
        ui.kv('Platform', `${result.host.os} (${result.host.arch})`);
        ui.kv('Roots', String(result.roots.length));
        ui.kv('Artifacts', ui.num(result.artifacts.length));
        ui.kv('Total size', ui.bytes(totalBytes(result.artifacts)));
        ui.kv('Est. tokens', ui.num(totalTokens(result.artifacts)));

        ui.heading('By category');
        printCounts(countByKind(result.artifacts));

        if (result.warnings.length > 0) {
          ui.heading('Warnings');
          for (const warning of result.warnings.slice(0, 10)) ui.warn(warning);
        }
        console.log();
        ui.success('Scan complete. Nothing was modified.');
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}
