import { pathExists, readJson, writeJson } from '@cem/shared';
import type { ArtifactScope, McpServerDefinition } from '@cem/core';
import { parseMcpServers, serverToConfigEntry, serversToMcpJson } from './parse.js';

/**
 * MCP write operations. Every function here only ever reads and writes the
 * user's OWN documented config files (e.g. `.mcp.json`, `settings.json`). CEM
 * never starts, stops, installs or executes an MCP server — it only edits the
 * declarative configuration the user could edit by hand.
 */

/** Export selected servers to a standalone `mcp.json` document. */
export async function exportServers(
  servers: readonly McpServerDefinition[],
  targetPath: string,
): Promise<void> {
  await writeJson(targetPath, serversToMcpJson(servers));
}

/** Import servers from an `mcp.json`-shaped file. */
export async function importServers(
  sourcePath: string,
  scope: ArtifactScope = 'project',
): Promise<McpServerDefinition[]> {
  const parsed = await readJson<Record<string, unknown>>(sourcePath);
  return parseMcpServers(parsed, sourcePath, scope);
}

async function readConfig(configPath: string): Promise<Record<string, unknown>> {
  if (!(await pathExists(configPath))) return {};
  try {
    return await readJson<Record<string, unknown>>(configPath);
  } catch {
    return {};
  }
}

function getServerMap(config: Record<string, unknown>): Record<string, unknown> {
  const value = config.mcpServers;
  return value && typeof value === 'object' ? { ...(value as Record<string, unknown>) } : {};
}

export interface UpsertResult {
  readonly added: number;
  readonly updated: number;
  readonly skipped: number;
}

/**
 * Merge servers into a config file's `mcpServers` map, preserving all other
 * keys. Existing servers are skipped unless `overwrite` is set.
 */
export async function upsertServers(
  configPath: string,
  servers: readonly McpServerDefinition[],
  options: { overwrite?: boolean } = {},
): Promise<UpsertResult> {
  const config = await readConfig(configPath);
  const mcpServers = getServerMap(config);
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const server of servers) {
    const exists = server.name in mcpServers;
    if (exists && !options.overwrite) {
      skipped += 1;
      continue;
    }
    mcpServers[server.name] = serverToConfigEntry(server);
    if (exists) updated += 1;
    else added += 1;
  }

  await writeJson(configPath, { ...config, mcpServers });
  return { added, updated, skipped };
}

/** Enable/disable a server by toggling its `disabled` flag in a config file. */
export async function setServerDisabled(
  configPath: string,
  name: string,
  disabled: boolean,
): Promise<boolean> {
  const config = await readConfig(configPath);
  const mcpServers = getServerMap(config);
  if (!(name in mcpServers)) return false;

  const entry = { ...(mcpServers[name] as Record<string, unknown>) };
  if (disabled) entry.disabled = true;
  else delete entry.disabled;
  mcpServers[name] = entry;

  await writeJson(configPath, { ...config, mcpServers });
  return true;
}

/** Remove a server entry from a config file. */
export async function removeServer(configPath: string, name: string): Promise<boolean> {
  const config = await readConfig(configPath);
  const mcpServers = getServerMap(config);
  if (!(name in mcpServers)) return false;

  delete mcpServers[name];
  await writeJson(configPath, { ...config, mcpServers });
  return true;
}
