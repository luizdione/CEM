import { describe, it, expect } from 'vitest';
import {
  estimateTokens,
  countLines,
  compareVersions,
  isFormatSupported,
  summarizeArtifacts,
  isCemManifest,
  getClaudeHome,
  getClaudeDesktopConfigPath,
  getKnownUserLocations,
  getProjectLocations,
  getCemDataDir,
} from './index.js';
import type { ScannedArtifact } from './types.js';

describe('tokens', () => {
  it('estimates tokens for text', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('hello world')).toBeGreaterThan(0);
    const big = 'word '.repeat(1000);
    expect(estimateTokens(big)).toBeGreaterThan(estimateTokens('word'));
  });

  it('counts lines', () => {
    expect(countLines('a\nb\nc')).toBe(3);
    expect(countLines('')).toBe(0);
  });
});

describe('version helpers', () => {
  it('compares semantic versions', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('1.2.0', '1.1.9')).toBe(1);
    expect(compareVersions('v1.0.0', '2.0.0')).toBe(-1);
  });

  it('accepts matching major format versions', () => {
    expect(isFormatSupported('1.0.0')).toBe(true);
    expect(isFormatSupported('1.5.2')).toBe(true);
    expect(isFormatSupported('2.0.0')).toBe(false);
  });
});

describe('manifest helpers', () => {
  it('summarizes artifacts by kind', () => {
    const artifacts: ScannedArtifact[] = [
      art('skill', 100),
      art('agent', 50),
      art('mcp', 10),
      art('memory', 200),
      art('command', 30),
      art('setting', 20),
    ];
    const summary = summarizeArtifacts(artifacts);
    expect(summary.skills).toBe(1);
    expect(summary.agents).toBe(1);
    expect(summary.mcpServers).toBe(1);
    expect(summary.markdownFiles).toBe(1);
    expect(summary.commands).toBe(1);
    expect(summary.configFiles).toBe(1);
    expect(summary.totalFiles).toBe(6);
    expect(summary.totalBytes).toBe(410);
  });

  it('validates manifest shape', () => {
    expect(isCemManifest({})).toBe(false);
    expect(
      isCemManifest({
        formatVersion: '1.0.0',
        cemVersion: '1.0.0',
        id: 'x',
        createdAt: 'now',
        contents: {},
        encryption: {},
      }),
    ).toBe(true);
  });
});

describe('locations', () => {
  it('resolves claude home', () => {
    expect(getClaudeHome('/home/u')).toBe('/home/u/.claude');
  });

  it('resolves desktop config per platform', () => {
    expect(getClaudeDesktopConfigPath({ platform: 'darwin', home: '/Users/u' })).toContain(
      'Library/Application Support/Claude/claude_desktop_config.json',
    );
    expect(
      getClaudeDesktopConfigPath({ platform: 'win32', home: 'C:\\u', env: { APPDATA: 'C:\\u\\AppData\\Roaming' } }),
    ).toContain('claude_desktop_config.json');
    expect(getClaudeDesktopConfigPath({ platform: 'linux', home: '/home/u', env: {} })).toContain(
      '.config/Claude/claude_desktop_config.json',
    );
  });

  it('lists user and project locations', () => {
    const user = getKnownUserLocations('/home/u');
    expect(user.some((l) => l.path === '/home/u/.claude.json')).toBe(true);
    expect(user.some((l) => l.kind === 'skill' && l.isDirectory)).toBe(true);

    const project = getProjectLocations('/repo');
    expect(project.some((l) => l.path === '/repo/CLAUDE.md')).toBe(true);
    expect(project.some((l) => l.path === '/repo/.mcp.json')).toBe(true);
  });

  it('resolves CEM data dir per platform', () => {
    expect(getCemDataDir({ platform: 'linux', home: '/home/u', env: {} })).toBe('/home/u/.config/cem');
    expect(getCemDataDir({ platform: 'darwin', home: '/Users/u', env: {} })).toContain(
      'Library/Application Support/CEM',
    );
  });
});

function art(kind: ScannedArtifact['kind'], size: number): ScannedArtifact {
  return {
    id: `${kind}-${size}`,
    kind,
    scope: 'user',
    path: `/x/${kind}`,
    name: kind,
    size,
    mtimeMs: 0,
  };
}
