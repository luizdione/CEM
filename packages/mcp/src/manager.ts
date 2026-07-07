import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathExists, readJson } from '@cem/shared';
import { type McpServerDefinition, getMcpConfigCandidates, type LocationEnv } from '@cem/core';
import { parseMcpServers } from './parse.js';

const REDACTED = '******';

export interface DiscoverMcpOptions extends LocationEnv {
  /** Additional project roots whose `.mcp.json` should be parsed. */
  readonly projectRoots?: readonly string[];
}

/**
 * Discover MCP servers across all documented, user-owned config files. Servers
 * defined in multiple files are all returned (with distinct `sourcePath`s) so
 * the UI can show provenance and conflicts. READ-ONLY.
 */
export async function discoverMcpServers(
  options: DiscoverMcpOptions = {},
): Promise<McpServerDefinition[]> {
  const home = options.home ?? homedir();
  const results: McpServerDefinition[] = [];

  for (const candidate of getMcpConfigCandidates(options)) {
    if (!(await pathExists(candidate))) continue;
    try {
      const parsed = await readJson<Record<string, unknown>>(candidate);
      const scope = candidate.endsWith('.claude.json') ? 'user' : 'desktop';
      results.push(...parseMcpServers(parsed, candidate, scope));

      // ~/.claude.json can also carry per-project mcpServers.
      if (candidate === join(home, '.claude.json') && parsed.projects) {
        const projects = parsed.projects as Record<string, unknown>;
        for (const [projectPath, value] of Object.entries(projects)) {
          results.push(...parseMcpServers(value, `${candidate}#${projectPath}`, 'project'));
        }
      }
    } catch {
      // Ignore malformed config; discovery is best-effort.
    }
  }

  for (const root of options.projectRoots ?? []) {
    const mcpPath = join(root, '.mcp.json');
    if (!(await pathExists(mcpPath))) continue;
    try {
      const parsed = await readJson<Record<string, unknown>>(mcpPath);
      results.push(...parseMcpServers(parsed, mcpPath, 'project'));
    } catch {
      // ignore
    }
  }

  return results;
}

/** Return a copy of a server with environment variable VALUES masked. */
export function redactServer(server: McpServerDefinition): McpServerDefinition {
  if (!server.env) return server;
  const env: Record<string, string> = {};
  for (const key of Object.keys(server.env)) env[key] = REDACTED;
  return { ...server, env };
}

/** Redact a list of servers for safe display/logging. */
export function redactServers(servers: readonly McpServerDefinition[]): McpServerDefinition[] {
  return servers.map(redactServer);
}

/** True when a server appears to carry secrets in its environment. */
export function hasSecrets(server: McpServerDefinition): boolean {
  if (!server.env) return false;
  return Object.keys(server.env).some((key) =>
    /(token|key|secret|password|credential|api)/i.test(key),
  );
}
