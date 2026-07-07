import { type ArtifactScope, type McpServerDefinition, type McpTransport } from '@cem/core';

interface RawMcpServer {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  type?: string;
  transport?: string;
  disabled?: boolean;
}

function normalizeTransport(raw: RawMcpServer): McpTransport {
  const declared = (raw.type ?? raw.transport ?? '').toLowerCase();
  if (declared === 'sse') return 'sse';
  if (declared === 'http' || declared === 'streamable-http') return 'http';
  if (declared === 'stdio') return 'stdio';
  if (raw.command) return 'stdio';
  if (raw.url) return 'http';
  return 'unknown';
}

/** Parse a `mcpServers` map into normalized server definitions. */
export function parseMcpServers(
  container: unknown,
  sourcePath: string,
  scope: ArtifactScope,
): McpServerDefinition[] {
  if (typeof container !== 'object' || container === null) return [];
  const record = container as Record<string, unknown>;
  const servers = record.mcpServers;
  if (typeof servers !== 'object' || servers === null) return [];

  const out: McpServerDefinition[] = [];
  for (const [name, rawValue] of Object.entries(servers as Record<string, unknown>)) {
    if (typeof rawValue !== 'object' || rawValue === null) continue;
    const raw = rawValue as RawMcpServer;
    out.push({
      name,
      transport: normalizeTransport(raw),
      ...(raw.command ? { command: raw.command } : {}),
      ...(raw.args ? { args: [...raw.args] } : {}),
      ...(raw.url ? { url: raw.url } : {}),
      ...(raw.env ? { env: { ...raw.env } } : {}),
      scope,
      sourcePath,
      ...(raw.disabled ? { disabled: true } : {}),
    });
  }
  return out;
}

/** Serialize a server definition back into `.mcp.json` entry shape. */
export function serverToConfigEntry(server: McpServerDefinition): Record<string, unknown> {
  const entry: Record<string, unknown> = {};
  if (server.transport === 'sse' || server.transport === 'http') {
    entry.type = server.transport;
    if (server.url) entry.url = server.url;
  }
  if (server.command) entry.command = server.command;
  if (server.args && server.args.length > 0) entry.args = server.args;
  if (server.env && Object.keys(server.env).length > 0) entry.env = server.env;
  if (server.disabled) entry.disabled = true;
  return entry;
}

/** Build a full `{ mcpServers: {...} }` document from server definitions. */
export function serversToMcpJson(
  servers: readonly McpServerDefinition[],
): { mcpServers: Record<string, unknown> } {
  const mcpServers: Record<string, unknown> = {};
  for (const server of servers) {
    mcpServers[server.name] = serverToConfigEntry(server);
  }
  return { mcpServers };
}
