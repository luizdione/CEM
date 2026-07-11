import type { ScannedArtifact } from '@cem/core';
import { parseUsage } from './parser.js';
import {
  bucketSeries,
  categoryTotals,
  filterWindow,
  groupByProject,
  groupBySession,
  typeTotals,
} from './aggregate.js';
import { analyzeUsage } from './insights.js';
import { entryTotal, type UsageReport, type UsageWindow } from './types.js';

export interface UsageReportOptions {
  readonly home?: string;
  readonly window?: UsageWindow;
  readonly now?: number;
  /** Scanned artifacts to correlate config-file weight with active projects. */
  readonly artifacts?: readonly ScannedArtifact[];
}

/** Build the full temporal usage report from local transcripts (read-only). */
export async function buildUsageReport(options: UsageReportOptions = {}): Promise<UsageReport> {
  const window = options.window ?? '7d';
  const now = options.now ?? Date.now();

  const all = await parseUsage(options.home !== undefined ? { home: options.home } : {});
  const entries = filterWindow(all, window, now);

  const sessions = groupBySession(entries);
  const projects = groupByProject(entries);
  const byCategory = categoryTotals(entries);
  const byType = typeTotals(entries);

  return {
    window,
    generatedAt: new Date(now).toISOString(),
    totalTokens: entries.reduce((s, e) => s + entryTotal(e), 0),
    messages: entries.length,
    byCategory,
    byType,
    sessions,
    projects,
    series: bucketSeries(entries, window, now),
    recommendations: analyzeUsage({
      sessions,
      projects,
      byCategory,
      byType,
      ...(options.artifacts ? { artifacts: options.artifacts } : {}),
    }),
  };
}
