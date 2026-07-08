import type { McpServerDefinition } from '@cem/core';
import { cem } from '../cem-api.js';
import { PageHead, Card, Badge, Spinner, EmptyState, useAsync } from '../components/common.js';

export function McpView(): JSX.Element {
  const { data, loading, error, reload } = useAsync(() => cem.listMcp({}), []);
  const servers = (data ?? []) as McpServerDefinition[];

  return (
    <div>
      <PageHead
        title="MCP Servers"
        subtitle="Discovered from documented config files. Secrets are masked."
        actions={
          <button className="btn" onClick={reload} disabled={loading}>
            {loading ? <Spinner /> : 'Refresh'}
          </button>
        }
      />

      <div className="note" style={{ marginBottom: 14 }}>
        CEM reads MCP definitions from your local config files only. It never starts, stops or
        modifies MCP servers.
      </div>

      {error && <Card style={{ borderColor: 'var(--bad)' }}>Could not read config: {error}</Card>}
      {loading && <Card>Reading MCP configuration…</Card>}
      {!loading && servers.length === 0 && (
        <EmptyState>No MCP servers found in the documented locations.</EmptyState>
      )}

      <div className="grid cols-2">
        {servers.map((server, i) => (
          <Card key={`${server.name}-${i}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong style={{ fontSize: 15 }}>{server.name}</strong>
              <Badge>{server.transport}</Badge>
              <Badge>{server.scope}</Badge>
              {server.disabled ? <Badge tone="warn">disabled</Badge> : null}
            </div>
            {server.command ? (
              <div className="mono" style={{ marginTop: 8, color: 'var(--text-dim)' }}>
                {server.command} {(server.args ?? []).join(' ')}
              </div>
            ) : null}
            {server.url ? (
              <div className="mono" style={{ marginTop: 8, color: 'var(--text-dim)' }}>
                {server.url}
              </div>
            ) : null}
            {server.env && Object.keys(server.env).length > 0 ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>Environment</div>
                {Object.entries(server.env).map(([k, v]) => (
                  <div key={k} className="mono" style={{ fontSize: 12 }}>
                    {k}={v}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mono" style={{ marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
              {server.sourcePath}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
