import type { Command } from 'commander';
import { discoverMcpServers, redactServers, hasSecrets } from '@cem/mcp';
import { ui, printJson, formatError } from '../ui.js';

export function registerMcp(program: Command): void {
  const mcp = program.command('mcp').description('Inspect MCP server configurations (read-only)');

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
}
