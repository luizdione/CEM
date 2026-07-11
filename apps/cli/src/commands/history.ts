import type { Command } from 'commander';
import { loadHistory, clearHistory, removeHistoryEntry, readAudit } from '@cem/core';
import { ui, printJson, formatError } from '../ui.js';

export function registerHistory(program: Command): void {
  const history = program
    .command('history')
    .description('View the local backup registry and audit log');

  history
    .command('list', { isDefault: true })
    .description('List recorded backups (newest first)')
    .option('--json', 'Output JSON', false)
    .action(async (opts: { json?: boolean }) => {
      try {
        const records = await loadHistory();
        if (opts.json) return printJson(records);
        if (records.length === 0) {
          ui.info('No backups recorded yet. Run "cem backup" to create one.');
          return;
        }
        ui.heading(`Backups (${records.length})`);
        for (const r of records) {
          const lock = r.encrypted ? '🔒' : '  ';
          ui.item(
            `${lock} ${r.createdAt}  ${ui.bytes(r.bytes)}  ${r.fileCount} files  ${ui.dim(r.path)}`,
          );
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });

  history
    .command('remove')
    .description('Remove a backup from the registry (does not delete the file)')
    .argument('<id>', 'Backup id')
    .action(async (id: string) => {
      try {
        const removed = await removeHistoryEntry(id);
        if (removed) ui.success(`Removed ${id} from the registry.`);
        else {
          ui.warn(`No registry entry with id ${id}.`);
          process.exitCode = 1;
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });

  history
    .command('clear')
    .description('Clear the backup registry (does not delete any files)')
    .action(async () => {
      try {
        await clearHistory();
        ui.success('Backup registry cleared.');
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });

  history
    .command('log')
    .description('Show the recent operation audit log')
    .option('--limit <n>', 'How many entries', '50')
    .option('--json', 'Output JSON', false)
    .action(async (opts: { limit?: string; json?: boolean }) => {
      try {
        const entries = await readAudit(Number(opts.limit) || 50);
        if (opts.json) return printJson(entries);
        if (entries.length === 0) {
          ui.info('No audited operations yet.');
          return;
        }
        ui.heading('Audit log');
        for (const e of entries) {
          const mark = e.ok ? ui.dim('ok ') : 'ERR';
          ui.item(`${e.timestamp}  ${mark}  ${e.action}  ${ui.dim(e.message ?? '')}`);
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}
