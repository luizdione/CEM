import { useState } from 'react';
import type { GroupUsage, UsageWindow } from '@cem/usage';
import { cem } from '../cem-api.js';
import { PageHead, Card, StatCard, Badge, Spinner, EmptyState, useAsync } from '../components/common.js';
import { formatNumber } from '../format.js';

const WINDOWS: UsageWindow[] = ['24h', '3d', '7d', '30d'];

export const CATEGORY_COLORS: Record<string, string> = {
  main: 'var(--accent-strong)',
  agents: '#a78bfa',
  git: '#fb923c',
  skills: '#34d399',
};

const CATEGORY_LABELS: Record<string, string> = {
  main: 'Main session',
  agents: 'Agents (workflow)',
  git: 'Git / GitHub',
  skills: 'Skills / launches',
};

export function UsageView(): JSX.Element {
  const [window, setWindow] = useState<UsageWindow>('7d');
  const { data, loading, error, reload } = useAsync(() => cem.usageReport({ window }), [window]);

  const maxBucket = Math.max(1, ...(data?.series.map((b) => b.total) ?? [1]));

  return (
    <div>
      <PageHead
        title="Token Usage"
        subtitle="Temporal consumption per session and project, from local transcripts (read-only)"
        actions={
          <>
            {WINDOWS.map((w) => (
              <button key={w} className={`btn${window === w ? ' primary' : ''}`} onClick={() => setWindow(w)}>
                {w}
              </button>
            ))}
            <button className="btn" onClick={reload} disabled={loading}>
              {loading ? <Spinner /> : 'Refresh'}
            </button>
          </>
        }
      />

      {error && <Card style={{ borderColor: 'var(--bad)' }}>Could not analyze: {error}</Card>}
      {loading && <Card>Reading session transcripts…</Card>}

      {data && (
        <>
          <div className="grid cols-4">
            <StatCard label={`Total (${data.window})`} value={formatNumber(data.totalTokens)} foot={`${formatNumber(data.messages)} messages`} />
            <StatCard label="Context read" value={formatNumber(data.byType.contextRead)} foot="context window cost" />
            <StatCard label="Context build" value={formatNumber(data.byType.contextBuild)} foot="cache creation" />
            <StatCard label="Output" value={formatNumber(data.byType.output)} foot="generated tokens" />
          </div>

          <Card style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>Timeline</h3>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLORS[key] }} />
                  {label}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 140, marginTop: 14 }}>
              {data.series.map((b) => (
                <div key={b.start} title={`${b.label}: ${formatNumber(b.total)} tokens`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                  {(['skills', 'git', 'agents', 'main'] as const).map((c) =>
                    b.byCategory[c] > 0 ? (
                      <div key={c} style={{ height: `${(b.byCategory[c] / maxBucket) * 100}%`, background: CATEGORY_COLORS[c], borderRadius: 1 }} />
                    ) : null,
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: 11, marginTop: 6 }}>
              <span>{data.series[0]?.label}</span>
              <span>{data.series[data.series.length - 1]?.label}</span>
            </div>
          </Card>

          <div className="grid cols-2" style={{ marginTop: 14 }}>
            <GroupCard title="By session" groups={data.sessions} shortKey />
            <GroupCard title="By project" groups={data.projects} />
          </div>

          <Card style={{ marginTop: 14 }}>
            <h3 style={{ marginTop: 0 }}>Improvement proposals</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 12.5, marginTop: 0 }}>
              Produced by statistical outlier analysis over your sessions (z-scores) plus domain heuristics — fully local and explainable.
            </p>
            {data.recommendations.map((rec) => (
              <div key={rec.id} style={{ borderTop: '1px solid var(--border)', padding: '10px 0' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge tone={rec.severity === 'important' ? 'warn' : rec.severity === 'suggestion' ? 'good' : undefined}>
                    {rec.severity}
                  </Badge>
                  <strong>{rec.title}</strong>
                  {rec.estimatedSavings ? (
                    <span style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 12 }}>
                      ~{formatNumber(rec.estimatedSavings)} tok
                    </span>
                  ) : null}
                </div>
                <p style={{ color: 'var(--text-dim)', margin: '6px 0 0' }}>{rec.detail}</p>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

function GroupCard({ title, groups, shortKey }: { title: string; groups: readonly GroupUsage[]; shortKey?: boolean }): JSX.Element {
  const max = Math.max(1, ...groups.map((g) => g.total));
  return (
    <Card>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {groups.length === 0 ? (
        <EmptyState>No activity in this window.</EmptyState>
      ) : (
        groups.slice(0, 10).map((g) => (
          <div key={g.key} style={{ margin: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
              <span className="mono">{shortKey ? `${g.key.slice(0, 8)}…` : shorten(g.project)}</span>
              <span style={{ color: 'var(--text-dim)' }}>
                {formatNumber(g.total)} tok · ctx/msg {formatNumber(g.avgContextPerMessage)}
              </span>
            </div>
            <div style={{ display: 'flex', height: 10, borderRadius: 999, overflow: 'hidden', background: 'var(--bg-elev-2)' }}>
              {(['main', 'agents', 'git', 'skills'] as const).map((c) =>
                g.byCategory[c] > 0 ? (
                  <div key={c} title={`${c}: ${formatNumber(g.byCategory[c])}`} style={{ width: `${(g.byCategory[c] / max) * 100}%`, background: CATEGORY_COLORS[c] }} />
                ) : null,
              )}
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

function shorten(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean);
  return parts.length > 2 ? `…/${parts.slice(-2).join('/')}` : path;
}
