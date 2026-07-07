import type { Command } from 'commander';
import { diagnoseEnvironment } from '@cem/diagnostics';
import { ui, printJson, formatError } from '../ui.js';

export function registerDoctor(program: Command): void {
  program
    .command('doctor')
    .description('Diagnose the environment (orphans, broken MCP, duplicates, token bloat)')
    .option('--home <dir>', 'Override the home directory to scan')
    .option('--projects', 'Also scan discovered project roots', false)
    .option('--json', 'Output JSON', false)
    .action(async (opts) => {
      try {
        const diagnosis = await diagnoseEnvironment({
          ...(opts.home ? { home: opts.home } : {}),
          discoverProjects: Boolean(opts.projects),
        });

        if (opts.json) {
          printJson(diagnosis);
          return;
        }

        const { report, rollup } = diagnosis;
        ui.heading('Environment Diagnosis');
        ui.kv('Artifacts', ui.num(diagnosis.scan.artifacts.length));
        ui.kv('MCP servers', ui.num(diagnosis.mcpServers.length));
        ui.kv('Est. tokens', ui.num(rollup.total));
        ui.kv('Errors', String(report.summary.errors));
        ui.kv('Warnings', String(report.summary.warnings));

        if (report.diagnostics.length > 0) {
          ui.heading('Findings');
          for (const d of report.diagnostics) {
            const line = d.path ? `${d.message} ${ui.dim(`(${d.path})`)}` : d.message;
            if (d.severity === 'error') ui.error(line);
            else if (d.severity === 'warning') ui.warn(line);
            else ui.info(line);
          }
        }

        console.log();
        if (report.summary.healthy) ui.success('No errors detected. Environment looks healthy.');
        else ui.error(`${report.summary.errors} error(s) need attention.`);
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}
