import type { Command } from 'commander';
import {
  discoverMcpServers,
  redactServers,
  hasSecrets,
  exportServers,
  importServers,
  upsertServers,
  setServerDisabled,
  removeServer,
} from '@cem/mcp';
import { appendAudit } from '@cem/core';
import { ui, printJson, formatError, confirm } from '../ui.js';

export function registerMcp(program: Command): void {
  const mcp = program.command('mcp').description('Inspect and edit MCP server configurations');

  mcp
    .command('list')
    .description('List all discovered MCP servers')
    .option('--home <dir>', 'Override the home directory')
    .option('--reveal', 'Show environment values instead of masking them', false)
    .option('--json', 'Output JSON', false)
    .action(async (opts: { home?: string; reveal?: boolean; json?: boolean }) => {
      try {
        const servers = await discoverMcpServers(opts.home ? { home: opts.home } : {});
        const display = opts.reveal ? servers : redactServers(servers);
        if (opts.json) return printJson(display);
        if (servers.length === 0) {
          ui.info('No MCP servers found in the documented config locations.');
          return;
        }
        ui.heading(`MCP servers (${servers.length})`);
        for (const server of display) {
          const secretFlag = hasSecrets(server) ? ui.dim(' [has secrets]') : '';
          ui.item(`${server.name} ${ui.dim(`· ${server.transport} · ${server.scope}`)}${secretFlag}`);
          if (server.command) ui.kv('  command', `${server.command} ${(server.args ?? []).join(' ')}`);
          if (server.url) ui.kv('  url', server.url);
          ui.kv('  source', server.sourcePath);
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });

  mcp
    .command('export')
    .description('Export discovered MCP servers to an mcp.json file')
    .argument('<file>', 'Destination mcp.json path')
    .option('--home <dir>', 'Override the home directory')
    .option('--name <names>', 'Comma-separated server names to include (default: all)')
    .action(async (file: string, opts: { home?: string; name?: string }) => {
      try {
        const all = await discoverMcpServers(opts.home ? { home: opts.home } : {});
        const wanted = opts.name
          ? new Set(opts.name.split(',').map((n) => n.trim()))
          : undefined;
        const servers = wanted ? all.filter((s) => wanted.has(s.name)) : all;
        if (servers.length === 0) {
          ui.warn('No matching MCP servers to export.');
          return;
        }
        await exportServers(servers, file);
        await appendAudit({ action: 'export', ok: true, message: `mcp → ${file}` }).catch(() => undefined);
        ui.success(`Exported ${servers.length} MCP server(s) to ${file}.`);
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });

  mcp
    .command('import')
    .description('Import MCP servers from an mcp.json into a config file (your own file)')
    .argument('<file>', 'Source mcp.json path')
    .requiredOption('--into <config>', 'Config file to merge into (e.g. ~/.claude/settings.json or .mcp.json)')
    .option('--overwrite', 'Overwrite servers that already exist', false)
    .action(async (file: string, opts: { into: string; overwrite?: boolean }) => {
      try {
        const servers = await importServers(file);
        if (servers.length === 0) {
          ui.warn('No MCP servers found in the source file.');
          return;
        }
        const result = await upsertServers(opts.into, servers, { overwrite: Boolean(opts.overwrite) });
        await appendAudit({
          action: 'import',
          ok: true,
          message: `mcp → ${opts.into}`,
          details: { ...result },
        }).catch(() => undefined);
        ui.success(
          `Imported into ${opts.into}: ${result.added} added, ${result.updated} updated, ${result.skipped} skipped.`,
        );
        if (result.skipped > 0 && !opts.overwrite) {
          ui.info('Some servers already existed. Re-run with --overwrite to replace them.');
        }
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });

  for (const state of ['enable', 'disable'] as const) {
    mcp
      .command(state)
      .description(`${state === 'enable' ? 'Enable' : 'Disable'} an MCP server in a config file`)
      .argument('<name>', 'Server name')
      .requiredOption('--config <file>', 'Config file that declares the server')
      .action(async (name: string, opts: { config: string }) => {
        try {
          const ok = await setServerDisabled(opts.config, name, state === 'disable');
          if (!ok) {
            ui.warn(`Server "${name}" not found in ${opts.config}.`);
            process.exitCode = 1;
            return;
          }
          await appendAudit({
            action: state === 'enable' ? 'install' : 'remove',
            ok: true,
            message: `mcp ${state} ${name}`,
          }).catch(() => undefined);
          ui.success(`${state === 'enable' ? 'Enabled' : 'Disabled'} "${name}" in ${opts.config}.`);
        } catch (error) {
          ui.error(formatError(error));
          process.exitCode = 1;
        }
      });
  }

  mcp
    .command('remove')
    .description('Remove an MCP server entry from a config file')
    .argument('<name>', 'Server name')
    .requiredOption('--config <file>', 'Config file that declares the server')
    .option('-y, --yes', 'Skip confirmation', false)
    .action(async (name: string, opts: { config: string; yes?: boolean }) => {
      try {
        if (!opts.yes) {
          const proceed = await confirm(`Remove MCP server "${name}" from ${opts.config}?`);
          if (!proceed) {
            ui.warn('Cancelled.');
            return;
          }
        }
        const ok = await removeServer(opts.config, name);
        if (!ok) {
          ui.warn(`Server "${name}" not found in ${opts.config}.`);
          process.exitCode = 1;
          return;
        }
        await appendAudit({ action: 'remove', ok: true, message: `mcp remove ${name}` }).catch(
          () => undefined,
        );
        ui.success(`Removed "${name}" from ${opts.config}.`);
      } catch (error) {
        ui.error(formatError(error));
        process.exitCode = 1;
      }
    });
}
