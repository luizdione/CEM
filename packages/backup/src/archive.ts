import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import {
  type Logger,
  CEM_FORMAT_VERSION,
  ensureDir,
  fileTimestamp,
  generateId,
  nowIso,
  silentLogger,
} from '@cem/shared';
import {
  type CemEntry,
  type CemManifest,
  type CemEncryptionHeader,
  type ScannedArtifact,
  getHostInfo,
  summarizeArtifacts,
} from '@cem/core';
import { encrypt, sha256 } from '@cem/crypto';
import { planArtifacts, type PlanContext } from './plan.js';

export interface BackupOptions {
  /** Directory to write the `.cem` file into. */
  readonly outDir: string;
  /** Output file name (a `.cem` extension is appended if missing). */
  readonly fileName?: string;
  /** When provided, the archive payload is encrypted with this password. */
  readonly password?: string;
  readonly notes?: string;
  readonly includeHostname?: boolean;
  readonly profilesIncluded?: readonly string[];
  readonly cemVersion?: string;
  readonly claudeVersion?: string;
  readonly logger?: Logger;
}

export interface BackupResult {
  readonly path: string;
  readonly bytes: number;
  readonly fileCount: number;
  readonly manifest: CemManifest;
  readonly encrypted: boolean;
  /** Source paths that could not be read and were skipped. */
  readonly skipped: readonly string[];
}

/**
 * Create a `.cem` backup archive from a set of scanned artifacts.
 *
 * Layout (unencrypted): `manifest.json` + `checksums.json` + `entries.json` +
 * `config.json` + category directories + `logs/backup.log`.
 * When a password is given, everything except `manifest.json` is packed into an
 * inner ZIP, encrypted with AES-256-GCM and stored as `payload.enc`.
 */
export async function createBackup(
  artifacts: readonly ScannedArtifact[],
  ctx: PlanContext,
  options: BackupOptions,
): Promise<BackupResult> {
  const logger = options.logger ?? silentLogger;
  const planned = planArtifacts(artifacts, ctx);

  const contentFiles: Record<string, Uint8Array> = {};
  const entries: CemEntry[] = [];
  const checksums: Record<string, string> = {};
  const includedArtifacts: ScannedArtifact[] = [];
  const skipped: string[] = [];

  for (let i = 0; i < planned.length; i += 1) {
    const file = planned[i]!;
    const artifact = artifacts[i]!;
    let bytes: Buffer;
    try {
      bytes = await readFile(file.sourcePath);
    } catch {
      logger.warn('Skipping unreadable file', { path: file.sourcePath });
      skipped.push(file.sourcePath);
      continue;
    }
    const digest = sha256(bytes);
    contentFiles[file.archivePath] = new Uint8Array(bytes);
    checksums[file.archivePath] = digest;
    entries.push({
      archivePath: file.archivePath,
      kind: file.kind,
      scope: file.scope,
      size: bytes.length,
      sha256: digest,
      originalPath: file.sourcePath,
      restore: file.restore,
    });
    includedArtifacts.push(artifact);
  }

  const configSnapshot = {
    createdAt: nowIso(),
    encrypted: Boolean(options.password),
    profilesIncluded: options.profilesIncluded ?? [],
    notes: options.notes ?? '',
    fileCount: entries.length,
  };

  const logLines = logger.snapshot().map((e) => `${e.timestamp} [${e.level}] ${e.message}`);
  const backupLog =
    logLines.length > 0
      ? logLines.join('\n')
      : `${nowIso()} [info] Backup created with ${entries.length} files.`;

  const payloadFiles: Record<string, Uint8Array> = {
    'checksums.json': strToU8(`${JSON.stringify(checksums, null, 2)}\n`),
    'entries.json': strToU8(`${JSON.stringify(entries, null, 2)}\n`),
    'config.json': strToU8(`${JSON.stringify(configSnapshot, null, 2)}\n`),
    'logs/backup.log': strToU8(`${backupLog}\n`),
    ...contentFiles,
  };

  const host = getHostInfo({
    ...(options.includeHostname ? { includeHostname: true } : {}),
    ...(options.claudeVersion ? { claudeVersion: options.claudeVersion } : {}),
  });

  let encryption: CemEncryptionHeader = { enabled: false };
  let outerFiles: Record<string, Uint8Array>;

  if (options.password) {
    const innerZip = zipSync(payloadFiles, { level: 9 });
    const envelope = await encrypt(Buffer.from(innerZip), options.password);
    encryption = {
      enabled: true,
      algorithm: envelope.algorithm,
      kdf: envelope.kdf,
      salt: envelope.salt,
      iv: envelope.iv,
      authTag: envelope.authTag,
      kdfParams: envelope.kdfParams,
    };
    outerFiles = { 'payload.enc': new Uint8Array(envelope.ciphertext) };
  } else {
    outerFiles = { ...payloadFiles };
  }

  const manifest: CemManifest = {
    formatVersion: CEM_FORMAT_VERSION,
    cemVersion: options.cemVersion ?? '1.0.0',
    id: generateId(),
    createdAt: nowIso(),
    host,
    encryption,
    contents: summarizeArtifacts(includedArtifacts),
    profilesIncluded: options.profilesIncluded ?? [],
    ...(options.notes ? { notes: options.notes } : {}),
  };

  outerFiles['manifest.json'] = strToU8(`${JSON.stringify(manifest, null, 2)}\n`);

  const archive = zipSync(outerFiles, { level: options.password ? 0 : 6 });

  await ensureDir(options.outDir);
  const fileName = normalizeFileName(options.fileName ?? `cem-backup-${fileTimestamp()}.cem`);
  const outPath = join(options.outDir, fileName);
  await writeFile(outPath, archive);

  logger.info('Backup written', { path: outPath, files: entries.length });

  return {
    path: outPath,
    bytes: archive.length,
    fileCount: entries.length,
    manifest,
    encrypted: Boolean(options.password),
    skipped,
  };
}

function normalizeFileName(name: string): string {
  return name.endsWith('.cem') ? name : `${name}.cem`;
}
