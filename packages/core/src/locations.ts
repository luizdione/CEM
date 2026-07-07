import { homedir } from 'node:os';
import { join } from 'node:path';
import type { KnownLocation } from './types.js';

export interface LocationEnv {
  readonly home?: string;
  readonly platform?: NodeJS.Platform;
  readonly env?: NodeJS.ProcessEnv;
}

/** The Claude Code user home directory (`~/.claude`). */
export function getClaudeHome(home: string = homedir()): string {
  return join(home, '.claude');
}

/**
 * Documented, user-owned Claude Code files and directories under the home
 * directory. CEM only ever READS these paths during a scan.
 */
export function getKnownUserLocations(home: string = homedir()): KnownLocation[] {
  const claude = getClaudeHome(home);
  return [
    loc('Claude user config', join(home, '.claude.json'), 'config', 'user', false, true),
    loc('User settings', join(claude, 'settings.json'), 'setting', 'user', false, true),
    loc('User local settings', join(claude, 'settings.local.json'), 'setting', 'user', false, true),
    loc('User memory (CLAUDE.md)', join(claude, 'CLAUDE.md'), 'memory', 'user', false, false),
    loc('User commands', join(claude, 'commands'), 'command', 'user', true, false),
    loc('User agents', join(claude, 'agents'), 'agent', 'user', true, false),
    loc('User skills', join(claude, 'skills'), 'skill', 'user', true, false),
    loc('User plugins', join(claude, 'plugins'), 'plugin', 'user', true, false),
    loc('Keybindings', join(claude, 'keybindings.json'), 'config', 'user', false, false),
    loc('Projects history', join(claude, 'projects'), 'project', 'user', true, true),
  ];
}

/**
 * Claude Code project-scoped files relative to a project root. These mirror the
 * documented project configuration layout (`.claude/`, `CLAUDE.md`, `.mcp.json`).
 */
export function getProjectLocations(projectRoot: string): KnownLocation[] {
  const dotClaude = join(projectRoot, '.claude');
  return [
    loc('Project memory', join(projectRoot, 'CLAUDE.md'), 'memory', 'project', false, false),
    loc('Project local memory', join(projectRoot, 'CLAUDE.local.md'), 'memory', 'project', false, false),
    loc('Project MCP config', join(projectRoot, '.mcp.json'), 'mcp', 'project', false, true),
    loc('Project settings', join(dotClaude, 'settings.json'), 'setting', 'project', false, false),
    loc('Project local settings', join(dotClaude, 'settings.local.json'), 'setting', 'project', false, true),
    loc('Project commands', join(dotClaude, 'commands'), 'command', 'project', true, false),
    loc('Project agents', join(dotClaude, 'agents'), 'agent', 'project', true, false),
    loc('Project skills', join(dotClaude, 'skills'), 'skill', 'project', true, false),
  ];
}

/**
 * Location of the Claude Desktop app's MCP configuration file. This is the
 * documented, user-editable `claude_desktop_config.json`.
 */
export function getClaudeDesktopConfigPath(env: LocationEnv = {}): string {
  const home = env.home ?? homedir();
  const platform = env.platform ?? process.platform;
  const penv = env.env ?? process.env;
  if (platform === 'win32') {
    const appData = penv.APPDATA ?? join(home, 'AppData', 'Roaming');
    return join(appData, 'Claude', 'claude_desktop_config.json');
  }
  if (platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }
  const xdg = penv.XDG_CONFIG_HOME ?? join(home, '.config');
  return join(xdg, 'Claude', 'claude_desktop_config.json');
}

/** Config files that may declare MCP servers (`mcpServers` key). */
export function getMcpConfigCandidates(env: LocationEnv = {}): string[] {
  const home = env.home ?? homedir();
  return [
    join(home, '.claude.json'),
    join(getClaudeHome(home), 'settings.json'),
    getClaudeDesktopConfigPath(env),
  ];
}

function loc(
  label: string,
  path: string,
  kind: KnownLocation['kind'],
  scope: KnownLocation['scope'],
  isDirectory: boolean,
  sensitive: boolean,
): KnownLocation {
  return { label, path, kind, scope, isDirectory, sensitive };
}
