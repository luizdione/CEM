/** Time windows supported by the usage analyzer (label → days). */
export const USAGE_WINDOWS = { '24h': 1, '3d': 3, '7d': 7, '30d': 30 } as const;
export type UsageWindow = keyof typeof USAGE_WINDOWS;

/** How a token spend is attributed. */
export type UsageCategory =
  | 'main' // work in the main session performed by Claude itself
  | 'agents' // external subagent/sidechain work in the workflow
  | 'git' // git/GitHub activity (push, commit, gh …)
  | 'skills'; // launching skills and internal agents

export const USAGE_CATEGORIES: readonly UsageCategory[] = ['main', 'agents', 'git', 'skills'];

/** One assistant turn extracted from a local session transcript. */
export interface UsageEntry {
  readonly timestamp: number; // epoch ms
  readonly sessionId: string;
  readonly project: string; // project root (cwd) or transcript dir name
  readonly category: UsageCategory;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheCreationTokens: number;
  readonly cacheReadTokens: number;
  readonly model?: string;
}

export function entryTotal(e: UsageEntry): number {
  return e.inputTokens + e.outputTokens + e.cacheCreationTokens + e.cacheReadTokens;
}

export type CategoryTotals = Record<UsageCategory, number>;

/** Token-type split: reading context vs building cache vs producing output. */
export interface TypeTotals {
  /** Context-window reading (input + cache reads) — "the cost of the session's memory". */
  readonly contextRead: number;
  /** Cache creation (context being written/churned). */
  readonly contextBuild: number;
  /** Generated output. */
  readonly output: number;
}

export interface GroupUsage {
  readonly key: string; // sessionId or project
  readonly project: string;
  readonly total: number;
  readonly messages: number;
  readonly byCategory: CategoryTotals;
  readonly byType: TypeTotals;
  /** Mean context-read tokens per assistant message (context-window weight). */
  readonly avgContextPerMessage: number;
  readonly firstTs: number;
  readonly lastTs: number;
}

export interface UsageBucket {
  readonly start: number; // epoch ms
  readonly label: string;
  readonly total: number;
  readonly byCategory: CategoryTotals;
}

export interface UsageReport {
  readonly window: UsageWindow;
  readonly generatedAt: string;
  readonly totalTokens: number;
  readonly messages: number;
  readonly byCategory: CategoryTotals;
  readonly byType: TypeTotals;
  readonly sessions: readonly GroupUsage[];
  readonly projects: readonly GroupUsage[];
  readonly series: readonly UsageBucket[];
  readonly recommendations: readonly UsageRecommendation[];
}

export interface UsageRecommendation {
  readonly id: string;
  readonly severity: 'info' | 'suggestion' | 'important';
  readonly title: string;
  readonly detail: string;
  /** Estimated tokens reclaimable in the analyzed window, when computable. */
  readonly estimatedSavings?: number;
}
