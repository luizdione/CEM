import { homedir } from 'node:os';
import type { ScannedArtifact } from '@cem/core';
import { getCemBackupsDir } from '@cem/core';
import { scanEnvironment, discoverProjectRoots, type ScanOptions } from '@cem/scanner';
import { createBackup, type BackupOptions, type BackupResult } from './archive.js';

export interface BackupEnvironmentOptions
  extends Omit<ScanOptions, 'computeHashes'>,
    Partial<Pick<BackupOptions, 'outDir' | 'fileName'>> {
  readonly password?: string;
  readonly notes?: string;
  readonly profilesIncluded?: readonly string[];
  readonly cemVersion?: string;
  /** Predicate to include/exclude artifacts (e.g. from a profile). */
  readonly filter?: (artifact: ScannedArtifact) => boolean;
}

/**
 * Convenience: scan the environment and immediately write a `.cem` backup.
 * Returns both the scan roots and the backup result.
 */
export async function backupEnvironment(
  options: BackupEnvironmentOptions = {},
): Promise<BackupResult> {
  const home = options.home ?? homedir();
  const discovered =
    (options.discoverProjects ?? true) ? await discoverProjectRoots(home) : [];
  const projectRoots = [...new Set([...(options.projectRoots ?? []), ...discovered])];

  const scan = await scanEnvironment({ ...options, computeHashes: false });
  const selected = options.filter ? scan.artifacts.filter(options.filter) : scan.artifacts;

  return createBackup(
    selected,
    { home, projectRoots },
    {
      outDir: options.outDir ?? getCemBackupsDir({ home }),
      ...(options.fileName ? { fileName: options.fileName } : {}),
      ...(options.password ? { password: options.password } : {}),
      ...(options.notes ? { notes: options.notes } : {}),
      ...(options.profilesIncluded ? { profilesIncluded: options.profilesIncluded } : {}),
      ...(options.cemVersion ? { cemVersion: options.cemVersion } : {}),
      ...(options.includeHostname ? { includeHostname: true } : {}),
      ...(options.claudeVersion ? { claudeVersion: options.claudeVersion } : {}),
      ...(options.logger ? { logger: options.logger } : {}),
    },
  );
}
