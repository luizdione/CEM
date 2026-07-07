import { randomUUID } from 'node:crypto';

/** Generate an RFC 4122 v4 UUID. */
export function generateId(): string {
  return randomUUID();
}

/** A short, URL-safe id derived from a UUID (12 hex chars). */
export function shortId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

/** ISO-8601 timestamp for the current moment. */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * A filesystem-safe timestamp suitable for backup file names, e.g.
 * `2025-01-31_14-05-09`.
 */
export function fileTimestamp(date: Date = new Date()): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

/** Turn an arbitrary label into a filesystem/slug-safe token. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}
