import type { AgentMetadata, SkillMetadata } from '@cem/core';
import { cem } from '../cem-api.js';
import { PageHead, Card, Badge, Spinner, EmptyState, useAsync } from '../components/common.js';
import { formatNumber } from '../format.js';

/** Rich manager view for skills or agents, showing parsed front-matter metadata. */
export function ManagerView({ mode }: { mode: 'skills' | 'agents' }): JSX.Element {
  const { data, loading, error, reload } = useAsync<SkillMetadata[] | AgentMetadata[]>(
    () => (mode === 'skills' ? cem.listSkills({}) : cem.listAgents({})),
    [mode],
  );

  const title = mode === 'skills' ? 'Skills' : 'Agents';
  const subtitle =
    mode === 'skills'
      ? 'Detected skills with description, version, author and dependencies'
      : 'Subagent definitions with model, tools and enabled state';

  return (
    <div>
      <PageHead
        title={title}
        subtitle={subtitle}
        actions={
          <button className="btn" onClick={reload} disabled={loading}>
            {loading ? <Spinner /> : 'Rescan'}
          </button>
        }
      />

      {error && <Card style={{ borderColor: 'var(--bad)' }}>Could not load: {error}</Card>}
      {loading && <Card>Reading {title.toLowerCase()}…</Card>}
      {!loading && (data?.length ?? 0) === 0 && (
        <EmptyState>No {title.toLowerCase()} found.</EmptyState>
      )}

      <div className="grid cols-2">
        {mode === 'skills'
          ? ((data ?? []) as SkillMetadata[]).map((s) => (
              <Card key={s.path}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 15 }}>{s.name}</strong>
                  {s.version ? <Badge>v{s.version}</Badge> : null}
                  <Badge>{s.scope}</Badge>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>
                    {formatNumber(s.tokens)} tok
                  </span>
                </div>
                {s.description ? (
                  <p style={{ color: 'var(--text-dim)', margin: '8px 0' }}>{s.description}</p>
                ) : null}
                {s.author ? <Meta k="Author" v={s.author} /> : null}
                <Meta k="Files" v={String(s.files.length)} />
                {s.dependencies?.length ? (
                  <Meta k="Dependencies" v={s.dependencies.join(', ')} />
                ) : null}
              </Card>
            ))
          : ((data ?? []) as AgentMetadata[]).map((a) => (
              <Card key={a.path}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ fontSize: 15 }}>{a.name}</strong>
                  {a.enabled ? <Badge tone="good">enabled</Badge> : <Badge tone="warn">disabled</Badge>}
                  <Badge>{a.scope}</Badge>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-dim)' }}>
                    {formatNumber(a.tokens)} tok
                  </span>
                </div>
                {a.description ? (
                  <p style={{ color: 'var(--text-dim)', margin: '8px 0' }}>{a.description}</p>
                ) : null}
                {a.model ? <Meta k="Model" v={a.model} /> : null}
                {a.tools?.length ? <Meta k="Tools" v={a.tools.join(', ')} /> : null}
              </Card>
            ))}
      </div>
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '3px 0', fontSize: 13 }}>
      <span style={{ color: 'var(--text-dim)', width: 110 }}>{k}</span>
      <span className="mono" style={{ fontSize: 12 }}>
        {v}
      </span>
    </div>
  );
}
