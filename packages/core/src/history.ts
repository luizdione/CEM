import { join } from 'node:path';
import { pathExists, readJson, writeJson } from '@cem/shared';
import { getCemDataDir, type PathEnv } from './paths.js';
import { loadConfig, saveConfig } from './config.js';

/** A record of a backup CEM has created, kept in a local registry. */
export interface BackupRecord {
  readonly id: string;
  readonly path: string;
  readonly createdAt: string;
  readonly encrypted: boolean;
  readonly fileCount: number;
  readonly bytes: number;
  readonly formatVersion: string;
  readonly cemVersion: string;
  readonly notes?: string;
  readonly profile?: string;
}

export function historyPath(env?: PathEnv): string {
  return join(getCemDataDir(env), 'history.json');
}

/** Load the backup registry (newest first). */
export async function loadHistory(env?: PathEnv): Promise<BackupRecord[]> {
  const path = historyPath(env);
  if (!(await pathExists(path))) return [];
  try {
    const list = await readJson<BackupRecord[]>(path);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Add a backup to the registry and update `config.lastBackupAt`. Newest entries
 * are stored first.
 */
export async function recordBackup(record: BackupRecord, env?: PathEnv): Promise<void> {
  const list = await loadHistory(env);
  list.unshift(record);
  await writeJson(historyPath(env), list);

  const config = await loadConfig(undefined, env);
  await saveConfig({ ...config, lastBackupAt: record.createdAt }, undefined, env);
}

/** Remove a registry entry by id. Returns true when something was removed. */
export async function removeHistoryEntry(id: string, env?: PathEnv): Promise<boolean> {
  const list = await loadHistory(env);
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  await writeJson(historyPath(env), next);
  return true;
}

/** Clear the entire backup registry. */
export async function clearHistory(env?: PathEnv): Promise<void> {
  await writeJson(historyPath(env), []);
}
