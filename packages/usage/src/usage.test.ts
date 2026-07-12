import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseUsage,
  filterWindow,
  groupBySession,
  groupByProject,
  bucketSeries,
  analyzeUsage,
  buildUsageReport,
  categoryTotals,
} from './index.js';

let home: string;
const NOW = Date.now();
const H = 60 * 60 * 1000;

function line(over: Record<string, unknown>, usage = {}, content: unknown[] = []): string {
  return JSON.stringify({
    type: 'assistant',
    sessionId: 'sess-1',
    cwd: '/proj/alpha',
    requestId: `req-${Math.random()}`,
    message: {
      id: `msg-${Math.random()}`,
      model: 'claude-sonnet-5',
      content,
      usage: { input_tokens: 100, output_tokens: 50, cache_creation_input_tokens: 10, cache_read_input_tokens: 400, ...usage },
    },
    timestamp: new Date(NOW - 2 * H).toISOString(),
    ...over,
  });
}

beforeAll(async () => {
  home = await mkdtemp(join(tmpdir(), 'cem-usage-'));
  const dir = join(home, '.claude', 'projects', '-proj-alpha');
  await mkdir(dir, { recursive: true });

  const dup = line({}); // duplicated line (same message id + requestId)
  const rows = [
    line({}), // main
    dup,
    dup, // duplicate → must be deduped
    line({ isSidechain: true, sessionId: 'sess-2' }, { cache_read_input_tokens: 90000 }), // agents, context-heavy
    line({}, {}, [{ type: 'tool_use', name: 'Bash', input: { command: 'git push origin main' } }]), // git
    line({}, {}, [{ type: 'tool_use', name: 'Skill', input: {} }]), // skills
    line({ timestamp: new Date(NOW - 40 * 24 * H).toISOString() }), // outside every window
    'not-json-at-all',
    JSON.stringify({ type: 'user', timestamp: new Date(NOW).toISOString() }), // no usage
  ];
  await writeFile(join(dir, 'sess-1.jsonl'), rows.join('\n'));
});

afterAll(async () => {
  await rm(home, { recursive: true, force: true });
});

describe('parseUsage', () => {
  it('parses, classifies and de-duplicates transcript entries', async () => {
    const entries = await parseUsage({ home });
    expect(entries).toHaveLength(6); // 7 valid minus 1 duplicate
    const cats = entries.map((e) => e.category).sort();
    expect(cats).toContain('agents');
    expect(cats).toContain('git');
    expect(cats).toContain('skills');
    expect(entries.every((e) => e.project === '/proj/alpha')).toBe(true);
  });
});

describe('windows and grouping', () => {
  it('filters by time window', async () => {
    const entries = await parseUsage({ home });
    expect(filterWindow(entries, '24h', NOW)).toHaveLength(5);
    expect(filterWindow(entries, '30d', NOW)).toHaveLength(5); // 40d-old entry excluded
  });

  it('groups by session and project with category totals', async () => {
    const entries = filterWindow(await parseUsage({ home }), '24h', NOW);
    const sessions = groupBySession(entries);
    expect(sessions.map((s) => s.key).sort()).toEqual(['sess-1', 'sess-2']);
    const projects = groupByProject(entries);
    expect(projects).toHaveLength(1);
    const totals = categoryTotals(entries);
    expect(totals.git).toBeGreaterThan(0);
    expect(totals.skills).toBeGreaterThan(0);
    expect(totals.agents).toBeGreaterThan(totals.main); // heavy sidechain entry
  });

  it('buckets a series for charting', async () => {
    const entries = filterWindow(await parseUsage({ home }), '24h', NOW);
    const series = bucketSeries(entries, '24h', NOW);
    expect(series).toHaveLength(24);
    expect(series.reduce((s, b) => s + b.total, 0)).toBeGreaterThan(0);
  });
});

describe('insights + report', () => {
  it('flags the context-heavy session for branching', async () => {
    const report = await buildUsageReport({ home, window: '24h', now: NOW });
    expect(report.totalTokens).toBeGreaterThan(0);
    const branch = report.recommendations.find((r) => r.id.startsWith('branch-sess-2'));
    expect(branch).toBeTruthy();
    expect(branch!.severity).toBe('important');
  });

  it('recommends shrinking heavy config files of active projects', async () => {
    const report = await buildUsageReport({
      home,
      window: '24h',
      now: NOW,
      artifacts: [
        { id: 'big', kind: 'memory', scope: 'project', path: '/proj/alpha/CLAUDE.md', name: 'CLAUDE.md', size: 1, mtimeMs: 0, tokens: 9000 },
      ],
    });
    const shrink = report.recommendations.find((r) => r.id === 'shrink-big');
    expect(shrink).toBeTruthy();
    expect(shrink!.detail).toContain('/proj/alpha');
  });

  it('reports healthy when there is nothing to flag', () => {
    const recs = analyzeUsage({
      sessions: [],
      projects: [],
      byCategory: { main: 0, agents: 0, git: 0, skills: 0 },
      byType: { contextRead: 0, contextBuild: 0, output: 0 },
    });
    expect(recs[0]!.id).toBe('healthy');
  });
});

describe('config-file load classification', () => {
  const base = { scope: 'user', size: 1, mtimeMs: 0 } as const;
  const analyze = (artifacts: Parameters<typeof analyzeUsage>[0]['artifacts']) =>
    analyzeUsage({
      sessions: [],
      projects: [],
      byCategory: { main: 0, agents: 0, git: 0, skills: 0 },
      byType: { contextRead: 0, contextBuild: 0, output: 0 },
      artifacts,
    });

  it('recommends shrinking SKILL.md per invocation, named after its skill', () => {
    const recs = analyze([
      { ...base, id: 'a', kind: 'skill', path: '/h/.claude/skills/build_paper/SKILL.md', name: 'SKILL.md', tokens: 4000 },
    ]);
    const rec = recs.find((r) => r.id === 'shrink-a')!;
    expect(rec.title).toContain('SKILL.md of build_paper');
    expect(rec.detail).toContain('name and description');
    expect(rec.estimatedSavings).toBe(4000);
  });

  it('resolves the skill name from Windows-style paths too', () => {
    const recs = analyze([
      { ...base, id: 'w', kind: 'skill', path: 'C:\\Users\\u\\.claude\\skills\\git_dione\\SKILL.md', name: 'SKILL.md', tokens: 3000 },
    ]);
    expect(recs.find((r) => r.id === 'shrink-w')!.title).toContain('SKILL.md of git_dione');
  });

  it('tells the user to run scripts instead of shrinking them', () => {
    const recs = analyze([
      { ...base, id: 's', kind: 'skill', path: '/h/.claude/skills/build_paper/ml/profile.py', name: 'profile.py', tokens: 6000 },
    ]);
    const rec = recs.find((r) => r.id === 'script-s')!;
    expect(rec.severity).toBe('info');
    expect(rec.title).toContain('Run profile.py');
    expect(rec.estimatedSavings).toBeUndefined();
  });

  it('tells the user to query data/corpus files instead of shrinking them', () => {
    const recs = analyze([
      { ...base, id: 'd', kind: 'skill', path: '/h/.claude/skills/build_paper/styles/corpus/x.txt', name: 'x.txt', tokens: 20000 },
      { ...base, id: 'j', kind: 'skill', path: '/h/.claude/skills/build_paper/journals/registry.json', name: 'registry.json', tokens: 3900 },
    ]);
    for (const id of ['data-d', 'data-j']) {
      const rec = recs.find((r) => r.id === id)!;
      expect(rec.title).toContain('Query');
      expect(rec.detail).toContain('lookup script');
      expect(rec.estimatedSavings).toBeUndefined();
    }
  });

  it('treats agent files as per-launch system prompts and memory as always loaded', () => {
    const recs = analyze([
      { ...base, id: 'ag', kind: 'agent', path: '/h/.claude/agents/professor_darwin.md', name: 'professor_darwin.md', tokens: 4200 },
      { ...base, id: 'mem', kind: 'memory', path: '/h/.claude/CLAUDE.md', name: 'CLAUDE.md', tokens: 5000 },
    ]);
    expect(recs.find((r) => r.id === 'shrink-ag')!.detail).toContain('system prompt');
    expect(recs.find((r) => r.id === 'shrink-mem')!.detail).toContain('start of every session');
  });

  it('marks non-entry markdown inside skills as on-demand reading', () => {
    const recs = analyze([
      { ...base, id: 'ref', kind: 'skill', path: '/h/.claude/skills/build_paper/reference/tom.md', name: 'tom.md', tokens: 2900 },
    ]);
    const rec = recs.find((r) => r.id === 'ondemand-ref')!;
    expect(rec.severity).toBe('info');
    expect(rec.title).toContain('on-demand');
  });
});
