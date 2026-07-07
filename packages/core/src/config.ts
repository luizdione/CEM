import { pathExists, readJson, writeJson } from '@cem/shared';
import { getCemBackupsDir, getCemConfigPath, type PathEnv } from './paths.js';

export type ThemePreference = 'light' | 'dark' | 'system';

/** CEM's own application configuration. */
export interface CemAppConfig {
  readonly version: string;
  readonly theme: ThemePreference;
  readonly defaultBackupDir: string;
  readonly includeProjectsByDefault: boolean;
  readonly encryptionByDefault: boolean;
  readonly scanRoots: readonly string[];
  readonly lastBackupAt?: string;
  /** CEM never collects telemetry; this flag exists only to make that explicit. */
  readonly telemetry: false;
}

export function defaultConfig(env?: PathEnv): CemAppConfig {
  return {
    version: '1.0.0',
    theme: 'system',
    defaultBackupDir: getCemBackupsDir(env),
    includeProjectsByDefault: false,
    encryptionByDefault: false,
    scanRoots: [],
    telemetry: false,
  };
}

/** Load CEM config, returning defaults when the file is absent. */
export async function loadConfig(configPath?: string, env?: PathEnv): Promise<CemAppConfig> {
  const path = configPath ?? getCemConfigPath(env);
  if (!(await pathExists(path))) {
    return defaultConfig(env);
  }
  const parsed = await readJson<Partial<CemAppConfig>>(path);
  return { ...defaultConfig(env), ...parsed, telemetry: false };
}

/** Persist CEM config to disk. */
export async function saveConfig(
  config: CemAppConfig,
  configPath?: string,
  env?: PathEnv,
): Promise<void> {
  const path = configPath ?? getCemConfigPath(env);
  await writeJson(path, { ...config, telemetry: false });
}
