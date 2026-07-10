import {
  USAGE_CATEGORIES,
  entryTotal,
  type CategoryTotals,
  type GroupUsage,
  type TypeTotals,
  type UsageBucket,
  type UsageEntry,
  type UsageWindow,
  USAGE_WINDOWS,
} from './types.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export function emptyCategories(): CategoryTotals {
  return { main: 0, agents: 0, git: 0, skills: 0 };
}

/** Keep only entries inside the window ending at `now`. */
export function filterWindow(
  entries: readonly UsageEntry[],
  window: UsageWindow,
  now: number = Date.now(),
): UsageEntry[] {
  const from = now - USAGE_WINDOWS[window] * DAY_MS;
  return entries.filter((e) => e.timestamp >= from && e.timestamp <= now);
}

export function typeTotals(entries: readonly UsageEntry[]): TypeTotals {
  let contextRead = 0;
  let contextBuild = 0;
  let output = 0;
  for (const e of entries) {
    contextRead += e.inputTokens + e.cacheReadTokens;
    contextBuild += e.cacheCreationTokens;
    output += e.outputTokens;
  }
  return { contextRead, contextBuild, output };
}

export function categoryTotals(entries: readonly UsageEntry[]): CategoryTotals {
  const totals = emptyCategories();
  for (const e of entries) totals[e.category] += entryTotal(e);
  return totals;
}

function buildGroup(key: string, project: string, entries: readonly UsageEntry[]): GroupUsage {
  const total = entries.reduce((s, e) => s + entryTotal(e), 0);
  const types = typeTotals(entries);
  return {
    key,
    project,
    total,
    messages: entries.length,
    byCategory: categoryTotals(entries),
    byType: types,
    avgContextPerMessage: entries.length > 0 ? Math.round(types.contextRead / entries.length) : 0,
    firstTs: entries[0]?.timestamp ?? 0,
    lastTs: entries[entries.length - 1]?.timestamp ?? 0,
  };
}

/** Group entries by session (largest first). */
export function groupBySession(entries: readonly UsageEntry[]): GroupUsage[] {
  const map = new Map<string, UsageEntry[]>();
  for (const e of entries) {
    const list = map.get(e.sessionId);
    if (list) list.push(e);
    else map.set(e.sessionId, [e]);
  }
  return [...map.entries()]
    .map(([key, list]) => buildGroup(key, list[0]?.project ?? '', list))
    .sort((a, b) => b.total - a.total);
}

/** Group entries by project (largest first). */
export function groupByProject(entries: readonly UsageEntry[]): GroupUsage[] {
  const map = new Map<string, UsageEntry[]>();
  for (const e of entries) {
    const list = map.get(e.project);
    if (list) list.push(e);
    else map.set(e.project, [e]);
  }
  return [...map.entries()]
    .map(([key, list]) => buildGroup(key, key, list))
    .sort((a, b) => b.total - a.total);
}

/** Time-bucketed series for charting: hourly for 24h, daily otherwise. */
export function bucketSeries(
  entries: readonly UsageEntry[],
  window: UsageWindow,
  now: number = Date.now(),
): UsageBucket[] {
  const size = window === '24h' ? HOUR_MS : DAY_MS;
  const count = window === '24h' ? 24 : USAGE_WINDOWS[window];
  const end = Math.ceil(now / size) * size;
  const buckets: UsageBucket[] = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const start = end - (i + 1) * size;
    const inBucket = entries.filter((e) => e.timestamp >= start && e.timestamp < start + size);
    const date = new Date(start);
    buckets.push({
      start,
      label:
        window === '24h'
          ? `${String(date.getHours()).padStart(2, '0')}h`
          : `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      total: inBucket.reduce((s, e) => s + entryTotal(e), 0),
      byCategory: categoryTotals(inBucket),
    });
  }
  return buckets;
}

/** Share of a category in a totals record, in [0,1]. */
export function categoryShare(totals: CategoryTotals, category: keyof CategoryTotals): number {
  const sum = USAGE_CATEGORIES.reduce((s, c) => s + totals[c], 0);
  return sum > 0 ? totals[category] / sum : 0;
}
