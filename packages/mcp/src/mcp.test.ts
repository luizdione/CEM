import { describe, it, expect } from 'vitest';
import {
  parseMcpServers,
  serverToConfigEntry,
  serversToMcpJson,
  redactServer,
  hasSecrets,
} from './index.js';

const CONFIG = {
  mcpServers: {
    filesystem: {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/data'],
      env: { API_TOKEN: 'super-secret' },
    },
    remote: {
      type: 'http',
      url: 'https://example.com/mcp',
    },
    stdioServer: {
      transport: 'stdio',
      command: 'my-mcp',
    },
  },
};

describe('parseMcpServers', () => {
  it('parses and normalizes transports', () => {
    const servers = parseMcpServers(CONFIG, '/home/u/.claude.json', 'user');
    expect(servers).toHaveLength(3);
    const fs = servers.find((s) => s.name === 'filesystem');
    expect(fs?.transport).toBe('stdio');
    expect(fs?.command).toBe('npx');
    const remote = servers.find((s) => s.name === 'remote');
    expect(remote?.transport).toBe('http');
    expect(remote?.url).toBe('https://example.com/mcp');
  });

  it('returns empty for malformed input', () => {
    expect(parseMcpServers(null, 'x', 'user')).toEqual([]);
    expect(parseMcpServers({ nope: 1 }, 'x', 'user')).toEqual([]);
  });
});

describe('serialization', () => {
  it('round-trips a server to config entry', () => {
    const [server] = parseMcpServers(CONFIG, 'x', 'user');
    const entry = serverToConfigEntry(server!);
    expect(entry.command).toBe('npx');
    expect(entry.env).toMatchObject({ API_TOKEN: 'super-secret' });
  });

  it('builds a full mcp.json document', () => {
    const servers = parseMcpServers(CONFIG, 'x', 'user');
    const doc = serversToMcpJson(servers);
    expect(Object.keys(doc.mcpServers)).toEqual(['filesystem', 'remote', 'stdioServer']);
  });
});

describe('redaction', () => {
  it('masks env values but keeps keys', () => {
    const [server] = parseMcpServers(CONFIG, 'x', 'user');
    const redacted = redactServer(server!);
    expect(redacted.env?.API_TOKEN).toBe('******');
    expect(server!.env?.API_TOKEN).toBe('super-secret');
  });

  it('detects secret-bearing servers', () => {
    const servers = parseMcpServers(CONFIG, 'x', 'user');
    expect(hasSecrets(servers.find((s) => s.name === 'filesystem')!)).toBe(true);
    expect(hasSecrets(servers.find((s) => s.name === 'remote')!)).toBe(false);
  });
});
