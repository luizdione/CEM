import type { ArtifactKind } from '@cem/shared';

/**
 * Map an artifact kind to the top-level category directory used inside a `.cem`
 * archive. These directory names mirror the documented archive layout.
 */
export function categoryDirForKind(kind: ArtifactKind): string {
  switch (kind) {
    case 'skill':
      return 'skills';
    case 'agent':
      return 'agents';
    case 'command':
      return 'commands';
    case 'mcp':
      return 'mcp';
    case 'plugin':
      return 'plugins';
    case 'memory':
    case 'markdown':
    case 'prompt':
    case 'template':
      return 'markdown';
    case 'config':
    case 'setting':
      return 'config';
    case 'project':
      return 'projects';
    default:
      return 'misc';
  }
}

/** All category directories that may appear in an archive. */
export const CEM_CATEGORY_DIRS = [
  'skills',
  'agents',
  'commands',
  'mcp',
  'plugins',
  'markdown',
  'config',
  'projects',
  'profiles',
  'misc',
] as const;
