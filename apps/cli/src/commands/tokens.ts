import type { Command } from 'commander';
import { readText } from '@cem/shared';
import { scanEnvironment, filterArtifacts } from '@cem/scanner';
import { analyzeMarkdown, buildTokenReport, type MarkdownDoc } from '@cem/markdown';
import type { MarkdownStats } from '@cem/core';
import { ui, printJson, formatError } from '../ui.js';

export function registerTokens(program: Command): void {
  program
    .command('tokens')
    .description('Analyze token usage and detect context waste (large/duplicated docs)')
    .option('--home <dir>', 'Override the home directory')
    .option('--projects', 'Include discovered project roots', false)
    .option('--threshold <n>', 'Large-file token threshold', '4000')
    .option('--json', 'Output JSON', false)
    .action(async (opts) => {
      try {
        const scan = await scanEnvironment({
          ...(opts.home ? { home: opts.home } : {}),
          discoverProjects: Boolean(opts.projects),
          computeTokens: true,
        });
        const docs = filterArtifacts(scan.artifacts, {
          kinds: ['markdown', 'memory', 'prompt', 'template', 'skill', 'agent'],
        });

        const stats: MarkdownStats[] = [];
        const contents: MarkdownDoc[] = [];
        for (const doc of docs) {
          try {
            const analysis = await analyzeMarkdown(doc.path, doc.scope);
            stats.push(analysis);
            contents.push({ path: doc.path, content: await readText(doc.path) });
          } catch {
            // skip unreadable
          }
        }

        const report = buildTokenReport(stats, contents, {
          largeFileTokenThreshold: Number(opts.threshold) || 4000,
        });

        if (opts.json) return printJson(report);

        ui.heading('Token analysis');
        ui.kv('Documents', ui.num(report.totalFiles));
        ui.kv('Total tokens', ui.num(report.totalTokens));
        ui.kv('Wasted (est.)', ui.num(report.estimatedWastedTokens));

        if (report.files.length > 0) {
          ui.heading('Heaviest documents');
          for (const f of report.files.slice(0, 10)) {
            ui.item(`${ui.num(f.tokens).padStart(7)} tok  ${ui.dim(f.name)}`);
          }
        }
        if (report.overlaps.length > 0) {
          ui.heading('Overlapping content');
          for (const o of report.overlaps.slice(0, 10)) {
            ui.item(`${(o.similarity * 100).toFixed(0)}%  ${ui.dim(`${o.a}  ↔  ${o.b}`)}`);
          }
        }
        ui.heading('Recommendations');
        for (const rec of report.recommendations) ui.info(rec);
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}
