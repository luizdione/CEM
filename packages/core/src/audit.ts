import { appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ensureDir, nowIso, pathExists, readText } from '@cem/shared';
import { getCemLogsDir, type PathEnv } from './paths.js';

/** Operations recorded in CEM's audit log. */
export type AuditAction =
  | 'scan'
  | 'backup'
  | 'restore'
  | 'import'
  | 'export'
  | 'verify'
  | 'diagnose'
  | 'profile-create'
  | 'profile-delete'
  | 'install'
  | 'remove';

export interface AuditEntry {
  readonly timestamp: string;
  readonly action: AuditAction;
  readonly ok: boolean;
  readonly message?: string;
  readonly details?: Record<string, unknown>;
}

export function auditLogPath(env?: PathEnv): string {
  return join(getCemLogsDir(env), 'audit.log');
}

/**
 * Append a single entry to CEM's append-only audit log (JSON Lines). Records
 * installs, removals, backups, restores, diagnostics and profile changes.
 */
export async function appendAudit(
  entry: Omit<AuditEntry, 'timestamp'>,
  env?: PathEnv,
): Promise<void> {
  const full: AuditEntry = { timestamp: nowIso(), ...entry };
  await ensureDir(getCemLogsDir(env));
  await appendFile(auditLogPath(env), `${JSON.stringify(full)}\n`, 'utf8');
}

/** Read the most recent audit entries (newest last), up to `limit`. */
export async function readAudit(limit = 200, env?: PathEnv): Promise<AuditEntry[]> {
  const path = auditLogPath(env);
  if (!(await pathExists(path))) return [];
  const raw = await readText(path);
  const entries: AuditEntry[] = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line) as AuditEntry);
    } catch {
      // skip corrupt lines
    }
  }
  return entries.slice(-limit);
}
