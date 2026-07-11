import type { ScannedArtifact } from '@cem/core';
import { categoryShare } from './aggregate.js';
import type { GroupUsage, UsageRecommendation, CategoryTotals, TypeTotals } from './types.js';

/**
 * Statistical evaluation of usage patterns. Recommendations are produced by
 * outlier detection (z-scores against the population of sessions) plus
 * domain heuristics — deterministic and explainable, no external services.
 */
export interface InsightInput {
  readonly sessions: readonly GroupUsage[];
  readonly projects: readonly GroupUsage[];
  readonly byCategory: CategoryTotals;
  readonly byType: TypeTotals;
  /** Scanned artifacts (config/skills/agents markdown) to correlate file weight with usage. */
  readonly artifacts?: readonly ScannedArtifact[];
}

const CONTEXT_HEAVY_FLOOR = 60_000; // avg context tokens/message considered heavy
const BIG_FILE_TOKENS = 2_500; // config files above this are shrink candidates

function mean(values: readonly number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function stddev(values: readonly number[], m: number): number {
  if (values.length < 2) return 0;
  return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1));
}

const CONFIG_KINDS = new Set(['memory', 'skill', 'agent', 'command', 'markdown']);

/** Produce improvement recommendations from aggregated usage. */
export function analyzeUsage(input: InsightInput): UsageRecommendation[] {
  const out: UsageRecommendation[] = [];
  const { sessions } = input;

  // --- Context-heavy sessions → branch/restart (z-score outliers + floor) ---
  const ctx = sessions.map((s) => s.avgContextPerMessage);
  const m = mean(ctx);
  const sd = stddev(ctx, m);
  for (const s of sessions) {
    const isOutlier = sd > 0 ? (s.avgContextPerMessage - m) / sd >= 1.5 : false;
    if (s.avgContextPerMessage >= CONTEXT_HEAVY_FLOOR && (isOutlier || sessions.length < 3)) {
      out.push({
        id: `branch-${s.key}`,
        severity: 'important',
        title: `Branch or restart session ${s.key.slice(0, 8)}…`,
        detail:
          `This session reads ~${s.avgContextPerMessage.toLocaleString()} context tokens per message ` +
          `(population mean ${Math.round(m).toLocaleString()}). Every reply re-reads that window. ` +
          `Start a fresh session (or branch the work) to reset the context and cut recurring cost.`,
        estimatedSavings: Math.max(0, (s.avgContextPerMessage - Math.round(m)) * s.messages),
      });
    }
  }

  // --- Heavy config files loaded by projects that are actually in use ---
  if (input.artifacts) {
    const activeProjects = new Set(input.projects.map((p) => p.project));
    const sessionsPerProject = new Map(input.projects.map((p) => [p.project, p.messages]));
    for (const artifact of input.artifacts) {
      if (!CONFIG_KINDS.has(artifact.kind) || (artifact.tokens ?? 0) < BIG_FILE_TOKENS) continue;
      const owner = [...activeProjects].find((p) => artifact.path.startsWith(p));
      const scopeNote = owner
        ? `It is loaded in project ${owner}, active in this window (${sessionsPerProject.get(owner) ?? 0} messages).`
        : 'It is part of your user-level configuration, loaded across sessions.';
      out.push({
        id: `shrink-${artifact.id}`,
        severity: 'suggestion',
        title: `Shrink ${artifact.name} (~${(artifact.tokens ?? 0).toLocaleString()} tokens)`,
        detail:
          `${artifact.path} is a large ${artifact.kind} file that enters the context window. ${scopeNote} ` +
          `Trim it or split rarely-used sections into referenced files.`,
        estimatedSavings: artifact.tokens ?? 0,
      });
    }
  }

  // --- Category-level heuristics ---
  const gitShare = categoryShare(input.byCategory, 'git');
  if (gitShare > 0.15) {
    out.push({
      id: 'batch-git',
      severity: 'suggestion',
      title: 'Batch your git/GitHub operations',
      detail: `${Math.round(gitShare * 100)}% of tokens in this window went to git/GitHub activity. Group commits/pushes at the end of a task instead of pushing incrementally.`,
    });
  }

  const total = input.byType.contextRead + input.byType.contextBuild + input.byType.output;
  if (total > 0 && input.byType.contextBuild / total > 0.4) {
    out.push({
      id: 'context-churn',
      severity: 'suggestion',
      title: 'High context churn detected',
      detail: `${Math.round((input.byType.contextBuild / total) * 100)}% of tokens went to (re)building context caches. Long-lived, stable sessions amortize this; frequent restarts with heavy configs do not.`,
    });
  }

  const agentShare = categoryShare(input.byCategory, 'agents');
  if (agentShare > 0.5) {
    out.push({
      id: 'agent-share',
      severity: 'info',
      title: 'Most work is delegated to agents',
      detail: `${Math.round(agentShare * 100)}% of tokens were spent in subagent workflows. That is often efficient, but verify agents are not re-reading large contexts each launch.`,
    });
  }

  if (out.length === 0) {
    out.push({
      id: 'healthy',
      severity: 'info',
      title: 'No obvious waste detected',
      detail: 'Token consumption looks proportional across sessions, categories and config files in this window.',
    });
  }

  return out.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function severityRank(s: UsageRecommendation['severity']): number {
  return s === 'important' ? 2 : s === 'suggestion' ? 1 : 0;
}
