import type { Command } from 'commander';
import { diagnoseEnvironment, proposeRemediations, applyRemediation } from '@cem/diagnostics';
import { appendAudit } from '@cem/core';
import { ui, printJson, formatError, confirm } from '../ui.js';

export function registerFix(program: Command): void {
  program
    .command('fix')
    .description('Diagnose and interactively resolve problems (accept/ignore each fix)')
    .option('--home <dir>', 'Override the home directory')
    .option('--projects', 'Include discovered project roots', false)
    .option('--dry-run', 'Show proposed fixes without applying', false)
    .option('-y, --yes', 'Apply all automatic fixes without prompting', false)
    .option('--json', 'Output JSON', false)
    .action(async (opts) => {
      try {
        const diagnosis = await diagnoseEnvironment({
          ...(opts.home ? { home: opts.home } : {}),
          discoverProjects: Boolean(opts.projects),
        });
        const remediations = proposeRemediations(diagnosis.report);

        if (opts.json) {
          if (opts.dryRun) return printJson({ remediations });
        }

        if (remediations.length === 0) {
          ui.success('No fixable problems found. Environment looks healthy.');
          return;
        }

        ui.heading(`Proposed fixes (${remediations.length})`);
        const applied: unknown[] = [];

        for (const rem of remediations) {
          const tag = rem.automatic
            ? rem.destructive
              ? ui.dim('[auto · deletes]')
              : ui.dim('[auto]')
            : ui.dim('[manual]');
          console.log();
          ui.item(`${rem.title} ${tag}`);
          console.log(`    ${ui.dim(rem.detail)}`);

          if (!rem.automatic) {
            ui.info('  Manual fix — CEM will not change anything for this item.');
            continue;
          }
          if (opts.dryRun) {
            ui.info('  (dry run — not applied)');
            continue;
          }

          const accept = opts.yes ? true : await confirm('  Apply this fix?');
          if (!accept) {
            ui.warn('  Ignored.');
            continue;
          }

          const result = await applyRemediation(rem);
          applied.push(result);
          await appendAudit({
            action: 'remove',
            ok: result.ok,
            message: `fix: ${rem.title}`,
            details: { applied: result.applied },
          }).catch(() => undefined);

          if (result.ok && result.applied) {
            ui.success(`  ${result.message}`);
            if (result.backup?.length) ui.kv('  backup', result.backup[0]!);
          } else {
            ui.warn(`  ${result.message}`);
          }
        }

        if (opts.json) return printJson({ remediations, applied });
        console.log();
        ui.success('Done. Backups of changed files are in CEM’s trash directory.');
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}
