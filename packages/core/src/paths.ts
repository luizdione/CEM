import { homedir } from 'node:os';
import { join } from 'node:path';

export interface PathEnv {
  readonly platform?: NodeJS.Platform;
  readonly env?: NodeJS.ProcessEnv;
  readonly home?: string;
}

/**
 * Resolve the directory where CEM stores its OWN data (config, profile
 * registry, backup index, logs). This is CEM's directory — never Claude Code's.
 */
export function getCemDataDir(opts: PathEnv = {}): string {
  const platform = opts.platform ?? process.platform;
  const env = opts.env ?? process.env;
  const home = opts.home ?? homedir();

  if (platform === 'win32') {
    const appData = env.APPDATA ?? join(home, 'AppData', 'Roaming');
    return join(appData, 'CEM');
  }
  if (platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'CEM');
  }
  const xdg = env.XDG_CONFIG_HOME ?? join(home, '.config');
  return join(xdg, 'cem');
}

export function getCemConfigPath(opts?: PathEnv): string {
  return join(getCemDataDir(opts), 'config.json');
}

export function getCemProfilesDir(opts?: PathEnv): string {
  return join(getCemDataDir(opts), 'profiles');
}

export function getCemLogsDir(opts?: PathEnv): string {
  return join(getCemDataDir(opts), 'logs');
}

/** Default directory where new `.cem` backups are written. */
export function getCemBackupsDir(opts: PathEnv = {}): string {
  const home = opts.home ?? homedir();
  return join(home, 'CEM Backups');
}
