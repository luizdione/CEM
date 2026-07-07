/** Global constants shared across the CEM toolchain. */

export const APP_NAME = 'Claude Environment Manager';
export const APP_SHORT_NAME = 'CEM';

/** File extension used by CEM archives. */
export const CEM_FILE_EXTENSION = '.cem';

/**
 * Version of the on-disk `.cem` archive format. Bump the major when the
 * archive layout changes in a backward-incompatible way.
 */
export const CEM_FORMAT_VERSION = '1.0.0';

/** Directory names inside a `.cem` archive. */
export const CEM_ARCHIVE_DIRS = {
  skills: 'skills',
  agents: 'agents',
  mcp: 'mcp',
  markdown: 'markdown',
  plugins: 'plugins',
  profiles: 'profiles',
  commands: 'commands',
  config: 'config',
  metadata: 'metadata',
  logs: 'logs',
} as const;

/** Canonical file names inside a `.cem` archive. */
export const CEM_ARCHIVE_FILES = {
  manifest: 'manifest.json',
  checksums: 'checksums.json',
  config: 'config.json',
} as const;

/** Rough characters-per-token ratio used by the heuristic token estimator. */
export const CHARS_PER_TOKEN = 4;

export type ArtifactKind =
  | 'skill'
  | 'agent'
  | 'mcp'
  | 'markdown'
  | 'plugin'
  | 'command'
  | 'config'
  | 'setting'
  | 'memory'
  | 'template'
  | 'prompt'
  | 'project'
  | 'unknown';
