import { CEM_FORMAT_VERSION } from '@cem/shared';
import type { CemContentSummary, CemManifest, ScannedArtifact } from './types.js';

/** Parse a semantic version string into numeric parts. */
export function parseVersion(version: string): [number, number, number] {
  const clean = version.trim().replace(/^v/, '');
  const [major = '0', minor = '0', patch = '0'] = clean.split('.', 3);
  return [Number(major) || 0, Number(minor) || 0, Number(patch) || 0];
}

/** Compare two semantic versions. Returns -1, 0 or 1. */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  for (let i = 0; i < 3; i += 1) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av > bv) return 1;
    if (av < bv) return -1;
  }
  return 0;
}

/**
 * A `.cem` archive is restorable when its MAJOR format version matches the one
 * this build understands. Newer minor/patch versions are read best-effort.
 */
export function isFormatSupported(formatVersion: string): boolean {
  const [major] = parseVersion(formatVersion);
  const [currentMajor] = parseVersion(CEM_FORMAT_VERSION);
  return major === currentMajor;
}

/** Roll up a list of scanned artifacts into a content summary. */
export function summarizeArtifacts(artifacts: readonly ScannedArtifact[]): CemContentSummary {
  const summary = {
    skills: 0,
    agents: 0,
    mcpServers: 0,
    markdownFiles: 0,
    plugins: 0,
    profiles: 0,
    commands: 0,
    configFiles: 0,
    totalFiles: 0,
    totalBytes: 0,
  };
  for (const artifact of artifacts) {
    summary.totalFiles += 1;
    summary.totalBytes += artifact.size;
    switch (artifact.kind) {
      case 'skill':
        summary.skills += 1;
        break;
      case 'agent':
        summary.agents += 1;
        break;
      case 'mcp':
        summary.mcpServers += 1;
        break;
      case 'markdown':
      case 'memory':
      case 'prompt':
      case 'template':
        summary.markdownFiles += 1;
        break;
      case 'plugin':
        summary.plugins += 1;
        break;
      case 'command':
        summary.commands += 1;
        break;
      case 'config':
      case 'setting':
        summary.configFiles += 1;
        break;
      default:
        break;
    }
  }
  return summary;
}

/** Type guard that validates the shape of a parsed manifest. */
export function isCemManifest(value: unknown): value is CemManifest {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.formatVersion === 'string' &&
    typeof v.cemVersion === 'string' &&
    typeof v.id === 'string' &&
    typeof v.createdAt === 'string' &&
    typeof v.contents === 'object' &&
    typeof v.encryption === 'object'
  );
}
