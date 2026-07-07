/** Human-friendly formatting helpers. */

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

/** Format a byte count as a human-readable string (base 1024). */
export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1) return '0 B';
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  const unit = BYTE_UNITS[exponent] ?? 'B';
  return `${value.toFixed(exponent === 0 ? 0 : fractionDigits)} ${unit}`;
}

/** Format a number with thousands separators. */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** Format an ISO date string as a compact, locale-neutral label. */
export function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toISOString().replace('T', ' ').slice(0, 19);
}

/** Return a relative "time ago" description for an ISO timestamp. */
export function timeAgo(iso: string | undefined, now: Date = new Date()): string {
  if (!iso) return 'never';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'never';
  const seconds = Math.max(0, Math.floor((now.getTime() - then) / 1000));
  const units: Array<[string, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [name, size] of units) {
    const amount = Math.floor(seconds / size);
    if (amount >= 1) return `${amount} ${name}${amount > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

/** Clamp a value into an inclusive range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
