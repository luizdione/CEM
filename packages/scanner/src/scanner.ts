import { basename } from 'node:path';
import { homedir } from 'node:os';
import {
  type Logger,
  type ArtifactKind,
  silentLogger,
  pathExists,
  readText,
  readJson,
  safeStat,
  walk,
} from '@cem/shared';
import {
  type ArtifactScope,
  type HostInfo,
  type KnownLocation,
  type ScanResult,
  type ScannedArtifact,
  estimateTokens,
  getClaudeHome,
  getHostInfo,
  getKnownUserLocations,
  getProjectLocations,
} from '@cem/core';
import { sha256 } from '@cem/crypto';
import { isTextFile, refineKind, MAX_TEXT_READ_BYTES } from './classify.js';

/** Subdirectories under `~/.claude` that hold runtime state, not user config. */
const SWEEP_IGNORE_DIRS = [
  'node_modules',
  '.git',
  '.cache',
  'statsig',
  'todos',
  'ide',
  'shell-snapshots',
  'logs',
];

export interface ScanOptions {
  readonly home?: string;
  readonly platform?: NodeJS.Platform;
  readonly env?: NodeJS.ProcessEnv;
  /** Extra project roots to scan (in addition to auto-discovered ones). */
  readonly projectRoots?: readonly string[];
  /** Auto-discover project roots from `~/.claude.json`. Defaults to true. */
  readonly discoverProjects?: boolean;
  /** Include the `~/.claude/projects` history (can be large/sensitive). */
  readonly includeProjectHistory?: boolean;
  /** Sweep the whole `~/.claude` tree for related markdown/config. Defaults to true. */
  readonly deepScan?: boolean;
  /** Read text files to estimate tokens. Defaults to true. */
  readonly computeTokens?: boolean;
  /** Compute a SHA-256 for every file. Off by default (slower). */
  readonly computeHashes?: boolean;
  readonly includeHostname?: boolean;
  readonly claudeVersion?: string;
  readonly logger?: Logger;
}

/**
 * Scan the local machine for Claude Code artifacts across documented
 * locations. This is strictly READ-ONLY — nothing is created, moved or deleted.
 */
export async function scanEnvironment(options: ScanOptions = {}): Promise<ScanResult> {
  const home = options.home ?? homedir();
  const logger = options.logger ?? silentLogger;
  const computeTokens = options.computeTokens ?? true;
  const computeHashes = options.computeHashes ?? false;
  const discoverProjects = options.discoverProjects ?? true;
  const deepScan = options.deepScan ?? true;

  const warnings: string[] = [];
  const artifacts: ScannedArtifact[] = [];
  const roots = new Set<string>();

  const seen = new Set<string>();
  const push = (artifact: ScannedArtifact): void => {
    if (seen.has(artifact.path)) return;
    seen.add(artifact.path);
    artifacts.push(artifact);
  };
  const ctx: CollectContext = { computeTokens, computeHashes, warnings, logger };

  // --- User-level known locations ---
  logger.debug('Scanning user locations', { home });
  for (const location of getKnownUserLocations(home)) {
    if (location.kind === 'project' && !options.includeProjectHistory) continue;
    await collectLocation(location, push, ctx);
    roots.add(location.path);
  }

  // --- Deep sweep of ~/.claude for any related markdown/config ---
  if (deepScan) {
    const claudeHome = getClaudeHome(home);
    if (await pathExists(claudeHome)) {
      const ignoreDirs = [...SWEEP_IGNORE_DIRS];
      if (!options.includeProjectHistory) ignoreDirs.push('projects');
      const entries = await walk(claudeHome, { ignoreDirs, maxDepth: 5 });
      for (const entry of entries) {
        if (seen.has(entry.path) || !isTextFile(entry.path)) continue;
        const kind = refineKind('unknown', basename(entry.path));
        push(await buildArtifact(entry.path, entry.size, entry.mtimeMs, kind, 'user', false, ctx));
      }
    }
  }

  // --- Project-level locations ---
  const projectRoots = new Set<string>(options.projectRoots ?? []);
  if (discoverProjects) {
    for (const discovered of await discoverProjectRoots(home)) projectRoots.add(discovered);
  }
  for (const projectRoot of projectRoots) {
    if (!(await pathExists(projectRoot))) continue;
    roots.add(projectRoot);
    for (const location of getProjectLocations(projectRoot)) {
      await collectLocation(location, push, ctx);
    }
  }

  const host: HostInfo = getHostInfo({
    ...(options.includeHostname ? { includeHostname: true } : {}),
    ...(options.claudeVersion ? { claudeVersion: options.claudeVersion } : {}),
  });

  logger.info('Scan complete', { artifacts: artifacts.length, warnings: warnings.length });

  return {
    scannedAt: new Date().toISOString(),
    roots: [...roots],
    host,
    artifacts,
    warnings,
  };
}

interface CollectContext {
  readonly computeTokens: boolean;
  readonly computeHashes: boolean;
  readonly warnings: string[];
  readonly logger: Logger;
}

async function collectLocation(
  location: KnownLocation,
  push: (a: ScannedArtifact) => void,
  ctx: CollectContext,
): Promise<void> {
  const stat = await safeStat(location.path);
  if (!stat) return;

  if (location.isDirectory && stat.isDirectory) {
    for (const entry of await walk(location.path)) {
      const kind = refineKind(location.kind, basename(entry.path));
      push(
        await buildArtifact(
          entry.path,
          entry.size,
          entry.mtimeMs,
          kind,
          location.scope,
          location.sensitive,
          ctx,
        ),
      );
    }
    return;
  }

  if (stat.isFile) {
    const kind = refineKind(location.kind, basename(location.path));
    push(
      await buildArtifact(
        location.path,
        stat.size,
        stat.mtimeMs,
        kind,
        location.scope,
        location.sensitive,
        ctx,
      ),
    );
  }
}

async function buildArtifact(
  filePath: string,
  size: number,
  mtimeMs: number,
  kind: ArtifactKind,
  scope: ArtifactScope,
  sensitive: boolean,
  ctx: CollectContext,
): Promise<ScannedArtifact> {
  let tokens: number | undefined;
  let sha: string | undefined;

  const readable = isTextFile(filePath) && size <= MAX_TEXT_READ_BYTES;
  if ((ctx.computeTokens || ctx.computeHashes) && readable) {
    try {
      const content = await readText(filePath);
      if (ctx.computeTokens) tokens = estimateTokens(content);
      if (ctx.computeHashes) sha = sha256(content);
    } catch (error) {
      ctx.warnings.push(`Could not read ${filePath}: ${(error as Error).message}`);
    }
  }

  return {
    id: sha256(filePath).slice(0, 16),
    kind,
    scope,
    path: filePath,
    name: basename(filePath),
    size,
    mtimeMs,
    ...(tokens !== undefined ? { tokens } : {}),
    ...(sha !== undefined ? { sha256: sha } : {}),
    ...(sensitive ? { sensitive: true } : {}),
  };
}

/**
 * Read `~/.claude.json` and return the absolute project paths Claude Code has
 * recorded. Missing/malformed files yield an empty list.
 */
export async function discoverProjectRoots(home: string = homedir()): Promise<string[]> {
  const claudeJson = `${home}/.claude.json`;
  if (!(await pathExists(claudeJson))) return [];
  try {
    const parsed = await readJson<{ projects?: Record<string, unknown> }>(claudeJson);
    if (!parsed.projects || typeof parsed.projects !== 'object') return [];
    const roots: string[] = [];
    for (const key of Object.keys(parsed.projects)) {
      if (key.startsWith('/') || /^[A-Za-z]:[\\/]/.test(key)) roots.push(key);
    }
    return roots;
  } catch {
    return [];
  }
}
