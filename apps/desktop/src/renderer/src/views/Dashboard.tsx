import { cem } from '../cem-api.js';
import { PageHead, StatCard, Card, Badge, Bar, Spinner, useAsync } from '../components/common.js';
import { formatBytes, formatNumber, formatDate, countBy } from '../format.js';

export function Dashboard({ onNavigate }: { onNavigate: (id: string) => void }): JSX.Element {
  const { data, loading, error, reload } = useAsync(async () => {
    const [diag, platform, profiles, config, usage] = await Promise.all([
      cem.diagnose({}),
      cem.platformInfo(),
      cem.listProfiles(),
      cem.getConfig(),
      cem.usageReport({ window: '7d' }).catch(() => undefined),
    ]);
    return { diag, platform, profiles, config, usage };
  }, []);

  return (
    <div>
      <PageHead
        title="Dashboard"
        subtitle="A read-only overview of your local Claude Code environment"
        actions={
          <button className="btn" onClick={reload} disabled={loading}>
            {loading ? <Spinner /> : 'Refresh'}
          </button>
        }
      />

      {loading && <Card>Scanning your environment…</Card>}
      {error && <Card style={{ borderColor: 'var(--bad)' }}>Could not load: {error}</Card>}

      {data && (
        <>
          {(() => {
            const counts = countBy(data.diag.scan.artifacts, (a) => a.kind);
            const { summary } = data.diag.report;
            const bytes = data.diag.scan.artifacts.reduce((s, a) => s + a.size, 0);
            const markdown =
              (counts.markdown ?? 0) +
              (counts.memory ?? 0) +
              (counts.prompt ?? 0) +
              (counts.template ?? 0);
            const kindTotal = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
            return (
              <>
                <div className="grid cols-4">
                  <StatCard
                    label="Environment"
                    value={
                      summary.healthy ? (
                        <Badge tone="good">Healthy</Badge>
                      ) : (
                        <Badge tone="bad">{summary.errors} issues</Badge>
                      )
                    }
                    foot={`${summary.warnings} warning(s)`}
                  />
                  <StatCard label="Skills" value={counts.skill ?? 0} />
                  <StatCard label="Agents" value={counts.agent ?? 0} />
                  <StatCard label="MCP servers" value={data.diag.mcpServers.length} />
                </div>

                <div className="grid cols-4" style={{ marginTop: 14 }}>
                  <StatCard label="Markdown docs" value={markdown} />
                  <StatCard label="Profiles" value={data.profiles.length} />
                  <StatCard label="Est. tokens" value={formatNumber(data.diag.rollup.total)} />
                  <StatCard label="Footprint" value={formatBytes(bytes)} />
                </div>

                <div className="grid cols-2" style={{ marginTop: 14 }}>
                  <Card>
                    <h3 style={{ marginTop: 0 }}>Platform</h3>
                    <Row k="Operating system" v={data.platform.host.os} />
                    <Row k="Architecture" v={data.platform.host.arch} />
                    <Row k="Node runtime" v={data.platform.host.nodeVersion} />
                    <Row
                      k="Claude Code"
                      v={data.platform.host.claudeVersion ?? 'not detected'}
                    />
                    <Row k="Last backup" v={formatDate(data.config.lastBackupAt)} />
                    <Row k="Total artifacts" v={formatNumber(data.diag.scan.artifacts.length)} />
                  </Card>

                  <Card>
                    <h3 style={{ marginTop: 0 }}>Distribution by category</h3>
                    {Object.entries(counts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([kind, n]) => (
                        <Bar key={kind} label={kind} value={n} max={kindTotal} />
                      ))}
                  </Card>
                </div>

                {data.usage && data.usage.projects.length > 0 && (
                  <Card style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0 }}>Token usage by project — last 7 days</h3>
                      <button className="btn" onClick={() => onNavigate('usage')}>
                        Open Token Usage
                      </button>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      {data.usage.projects.slice(0, 6).map((p) => (
                        <Bar
                          key={p.key}
                          label={p.project.split(/[/\\]/).filter(Boolean).slice(-1)[0] ?? p.project}
                          value={p.total}
                          max={data.usage!.projects[0]?.total ?? 1}
                        />
                      ))}
                    </div>
                  </Card>
                )}

                <Card style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0 }}>Alerts</h3>
                    <button className="btn" onClick={() => onNavigate('diagnostics')}>
                      Open diagnostics
                    </button>
                  </div>
                  {data.diag.report.diagnostics.length === 0 ? (
                    <p style={{ color: 'var(--text-dim)' }}>No alerts. Everything looks good.</p>
                  ) : (
                    <div style={{ marginTop: 10 }}>
                      {data.diag.report.diagnostics.slice(0, 6).map((d) => (
                        <div key={d.id} style={{ margin: '6px 0' }}>
                          <Badge tone={d.severity === 'error' ? 'bad' : d.severity === 'warning' ? 'warn' : undefined}>
                            {d.severity}
                          </Badge>{' '}
                          {d.message}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
      <span style={{ color: 'var(--text-dim)' }}>{k}</span>
      <span className="mono">{v}</span>
    </div>
  );
}
