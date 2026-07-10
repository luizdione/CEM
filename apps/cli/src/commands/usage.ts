import type { Command } from 'commander';
import { buildUsageReport, USAGE_WINDOWS, type UsageWindow } from '@cem/usage';
import { scanEnvironment } from '@cem/scanner';
import { ui, printJson, formatError } from '../ui.js';

export function registerUsage(program: Command): void {
  program
    .command('usage')
    .description('Temporal token usage per session/project from local transcripts (read-only)')
    .option('--window <w>', 'Time window: 24h | 3d | 7d | 30d', '7d')
    .option('--home <dir>', 'Override the home directory')
    .option('--json', 'Output JSON', false)
    .action(async (opts: { window: string; home?: string; json?: boolean }) => {
      try {
        if (!(opts.window in USAGE_WINDOWS)) {
          ui.error(`Invalid window "${opts.window}". Use one of: ${Object.keys(USAGE_WINDOWS).join(', ')}.`);
          process.exitCode = 1;
          return;
        }
        const scan = await scanEnvironment({
          ...(opts.home ? { home: opts.home } : {}),
          discoverProjects: true,
          computeTokens: true,
        });
        const report = await buildUsageReport({
          ...(opts.home ? { home: opts.home } : {}),
          window: opts.window as UsageWindow,
          artifacts: scan.artifacts,
        });

        if (opts.json) return printJson(report);

        ui.heading(`Token usage — last ${report.window}`);
        ui.kv('Total tokens', ui.num(report.totalTokens));
        ui.kv('Messages', ui.num(report.messages));
        ui.kv('Context read', ui.num(report.byType.contextRead));
        ui.kv('Context build', ui.num(report.byType.contextBuild));
        ui.kv('Output', ui.num(report.byType.output));

        ui.heading('By activity');
        ui.kv('Main session', ui.num(report.byCategory.main));
        ui.kv('Agents (workflow)', ui.num(report.byCategory.agents));
        ui.kv('Git / GitHub', ui.num(report.byCategory.git));
        ui.kv('Skills / launches', ui.num(report.byCategory.skills));

        if (report.projects.length > 0) {
          ui.heading('By project');
          for (const p of report.projects.slice(0, 8)) {
            ui.item(`${ui.num(p.total).padStart(12)}  ${ui.dim(p.project)}  (${p.messages} msgs)`);
          }
        }
        if (report.sessions.length > 0) {
          ui.heading('Heaviest sessions');
          for (const s of report.sessions.slice(0, 8)) {
            ui.item(
              `${ui.num(s.total).padStart(12)}  ${s.key.slice(0, 8)}…  ${ui.dim(`ctx/msg ${ui.num(s.avgContextPerMessage)}`)}`,
            );
          }
        }

        ui.heading('Recommendations');
        for (const rec of report.recommendations) {
          const mark = rec.severity === 'important' ? '!' : rec.severity === 'suggestion' ? '•' : 'i';
          console.log(`  ${mark} ${rec.title}`);
          console.log(`    ${ui.dim(rec.detail)}`);
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}
