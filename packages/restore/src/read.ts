import { readFile } from 'node:fs/promises';
import { unzip, strFromU8, type Unzipped } from 'fflate';
import { RestoreError, UnsupportedVersionError, ValidationError } from '@cem/shared';
import { type CemEntry, type CemManifest, isCemManifest, isFormatSupported } from '@cem/core';
import { decrypt } from '@cem/crypto';

const RESERVED_FILES = new Set(['manifest.json', 'checksums.json', 'entries.json', 'config.json']);

/**
 * Decompress off the main thread (fflate spawns worker threads); a synchronous
 * unzip of a large archive would freeze the Electron UI for its duration.
 */
function unzipAsync(bytes: Uint8Array): Promise<Unzipped> {
  return new Promise((resolve, reject) => {
    unzip(bytes, (err, data) => (err ? reject(err) : resolve(data)));
  });
}

export interface CemArchive {
  readonly manifest: CemManifest;
  readonly entries: readonly CemEntry[];
  readonly checksums: Readonly<Record<string, string>>;
  readonly config: unknown;
  /** Content files only: archivePath → bytes. */
  readonly files: Readonly<Record<string, Uint8Array>>;
  readonly encrypted: boolean;
}

/** Read just the manifest of a `.cem` file (no password required). */
export async function readManifest(archivePath: string): Promise<CemManifest> {
  const bytes = await readFile(archivePath);
  const outer = await unzipAsync(new Uint8Array(bytes));
  const manifestBytes = outer['manifest.json'];
  if (!manifestBytes) throw new ValidationError('Not a valid .cem archive: manifest.json missing.');
  const manifest = JSON.parse(strFromU8(manifestBytes)) as unknown;
  if (!isCemManifest(manifest)) throw new ValidationError('Invalid manifest in .cem archive.');
  return manifest;
}

/**
 * Read and decode a `.cem` archive. When the archive is encrypted, `password`
 * is required and used to decrypt the payload.
 */
export async function readCemArchive(
  archivePath: string,
  password?: string,
): Promise<CemArchive> {
  const bytes = await readFile(archivePath);
  const outer = await unzipAsync(new Uint8Array(bytes));

  const manifestBytes = outer['manifest.json'];
  if (!manifestBytes) throw new ValidationError('Not a valid .cem archive: manifest.json missing.');
  const manifest = JSON.parse(strFromU8(manifestBytes)) as CemManifest;
  if (!isCemManifest(manifest)) throw new ValidationError('Invalid manifest in .cem archive.');
  if (!isFormatSupported(manifest.formatVersion)) {
    throw new UnsupportedVersionError(
      `Archive format ${manifest.formatVersion} is not supported by this version of CEM.`,
    );
  }

  let payload: Record<string, Uint8Array>;
  if (manifest.encryption.enabled) {
    if (!password) throw new ValidationError('This archive is encrypted; a password is required.');
    const enc = outer['payload.enc'];
    if (!enc) throw new RestoreError('Encrypted archive is missing its payload.enc entry.');
    const { algorithm, kdf, salt, iv, authTag, kdfParams } = manifest.encryption;
    if (!salt || !iv || !authTag || !kdfParams || !algorithm || !kdf) {
      throw new RestoreError('Encryption header is incomplete.');
    }
    const plaintext = await decrypt(
      { algorithm, kdf, salt, iv, authTag, kdfParams },
      Buffer.from(enc),
      password,
    );
    payload = await unzipAsync(new Uint8Array(plaintext));
  } else {
    payload = { ...outer };
    delete payload['manifest.json'];
  }

  const checksums = parseJsonEntry<Record<string, string>>(payload, 'checksums.json') ?? {};
  const entries = parseJsonEntry<CemEntry[]>(payload, 'entries.json') ?? [];
  const config = parseJsonEntry<unknown>(payload, 'config.json') ?? null;

  const files: Record<string, Uint8Array> = {};
  for (const [path, data] of Object.entries(payload)) {
    if (RESERVED_FILES.has(path)) continue;
    if (path.startsWith('logs/')) continue;
    files[path] = data;
  }

  return { manifest, entries, checksums, config, files, encrypted: manifest.encryption.enabled };
}

function parseJsonEntry<T>(files: Record<string, Uint8Array>, name: string): T | undefined {
  const bytes = files[name];
  if (!bytes) return undefined;
  try {
    return JSON.parse(strFromU8(bytes)) as T;
  } catch {
    return undefined;
  }
}
