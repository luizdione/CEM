import { writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { type ArtifactKind, type Logger, ensureDir, pathExists, silentLogger } from '@cem/shared';
import type { CemEntry } from '@cem/core';
import { readCemArchive, type CemArchive } from './read.js';
import { verifyArchive, type VerifyResult } from './verify.js';
import { IntegrityError } from '@cem/shared';

export interface RestoreOptions {
  /** Target home directory (defaults to the current user's home). */
  readonly home?: string;
  /** Compute the plan without writing anything. */
  readonly dryRun?: boolean;
  /** Overwrite files that already exist (otherwise they are reported as conflicts). */
  readonly overwrite?: boolean;
  /** Restrict restore to these artifact kinds. */
  readonly kinds?: readonly ArtifactKind[];
  /** Additional per-entry predicate. */
  readonly select?: (entry: CemEntry) => boolean;
  /** Base directory for project-scoped files. */
  readonly projectBaseDir?: string;
  /** Base directory for absolute/external files. */
  readonly externalBaseDir?: string;
  readonly logger?: Logger;
}

export interface RestorePlanItem {
  readonly entry: CemEntry;
  readonly targetPath: string;
  readonly exists: boolean;
}

export interface RestoreResult {
  readonly restored: readonly string[];
  readonly skipped: readonly string[];
  readonly conflicts: readonly string[];
  readonly dryRun: boolean;
}

/** Resolve the on-disk destination for an archive entry. */
export function resolveTarget(entry: CemEntry, options: RestoreOptions = {}): string {
  const home = options.home ?? homedir();
  switch (entry.restore.base) {
    case 'home':
      return join(home, entry.restore.relative);
    case 'project':
      return join(
        options.projectBaseDir ?? join(home, 'CEM Restored Projects'),
        entry.restore.projectSlug ?? 'project',
        entry.restore.relative,
      );
    case 'absolute':
    default:
      return join(
        options.externalBaseDir ?? join(home, 'CEM Restored External'),
        basename(entry.restore.relative),
      );
  }
}

function isSelected(entry: CemEntry, options: RestoreOptions): boolean {
  if (options.kinds && options.kinds.length > 0 && !options.kinds.includes(entry.kind)) return false;
  if (options.select && !options.select(entry)) return false;
  return true;
}

/** Build the list of files that would be restored, with conflict detection. */
export async function computeRestoreTargets(
  archive: CemArchive,
  options: RestoreOptions = {},
): Promise<RestorePlanItem[]> {
  const items: RestorePlanItem[] = [];
  for (const entry of archive.entries) {
    if (!isSelected(entry, options)) continue;
    const targetPath = resolveTarget(entry, options);
    items.push({ entry, targetPath, exists: await pathExists(targetPath) });
  }
  return items;
}

/** Restore selected files from an already-decoded archive. */
export async function restoreArchive(
  archive: CemArchive,
  options: RestoreOptions = {},
): Promise<RestoreResult> {
  const logger = options.logger ?? silentLogger;
  const dryRun = options.dryRun ?? false;
  const items = await computeRestoreTargets(archive, options);

  const restored: string[] = [];
  const skipped: string[] = [];
  const conflicts: string[] = [];

  for (const item of items) {
    const bytes = archive.files[item.entry.archivePath];
    if (!bytes) {
      skipped.push(item.entry.archivePath);
      continue;
    }
    if (item.exists && !options.overwrite) {
      conflicts.push(item.targetPath);
      continue;
    }
    if (!dryRun) {
      await ensureDir(dirname(item.targetPath));
      await writeFile(item.targetPath, bytes);
    }
    restored.push(item.targetPath);
  }

  logger.info('Restore complete', {
    restored: restored.length,
    conflicts: conflicts.length,
    dryRun,
  });

  return { restored, skipped, conflicts, dryRun };
}

export interface RestoreFromFileOptions extends RestoreOptions {
  readonly password?: string;
  /** Restore even if integrity verification fails (not recommended). */
  readonly force?: boolean;
}

export interface RestoreFromFileResult {
  readonly archive: CemArchive;
  readonly verify: VerifyResult;
  readonly result: RestoreResult;
}

/** Read, verify and restore a `.cem` file in one call. */
export async function restoreFromFile(
  archivePath: string,
  options: RestoreFromFileOptions = {},
): Promise<RestoreFromFileResult> {
  const archive = await readCemArchive(archivePath, options.password);
  const verify = verifyArchive(archive);
  if (!verify.ok && !options.force) {
    throw new IntegrityError('Archive integrity check failed; refusing to restore.', {
      details: { mismatches: verify.mismatches, missing: verify.missing },
    });
  }
  const result = await restoreArchive(archive, options);
  return { archive, verify, result };
}
