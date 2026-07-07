import { sha256, digestsEqual } from '@cem/crypto';
import type { CemArchive } from './read.js';

export interface VerifyResult {
  readonly ok: boolean;
  readonly verified: number;
  /** Entries whose content hash did not match the manifest. */
  readonly mismatches: readonly string[];
  /** Entries whose content bytes were absent from the archive. */
  readonly missing: readonly string[];
}

/**
 * Verify that every file in the archive matches its recorded SHA-256. This is
 * the integrity gate the restore flow runs before touching the filesystem.
 */
export function verifyArchive(archive: CemArchive): VerifyResult {
  const mismatches: string[] = [];
  const missing: string[] = [];
  let verified = 0;

  for (const entry of archive.entries) {
    const bytes = archive.files[entry.archivePath];
    if (!bytes) {
      missing.push(entry.archivePath);
      continue;
    }
    const expected = archive.checksums[entry.archivePath] ?? entry.sha256;
    if (!digestsEqual(sha256(Buffer.from(bytes)), expected)) {
      mismatches.push(entry.archivePath);
    } else {
      verified += 1;
    }
  }

  return { ok: mismatches.length === 0 && missing.length === 0, verified, mismatches, missing };
}
