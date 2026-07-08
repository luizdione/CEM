import { cem } from '../cem-api.js';
import { PageHead, Card, StatCard, Badge, Spinner, useAsync } from '../components/common.js';

export function DiagnosticsView(): JSX.Element {
  const { data, loading, error, reload } = useAsync(() => cem.diagnose({}), []);

  return (
    <div>
      <PageHead
        title="Diagnostics"
        subtitle="Detect orphans, broken MCP configs, duplicates and token bloat"
        actions={
          <button className="btn" onClick={reload} disabled={loading}>
            {loading ? <Spinner /> : 'Run again'}
          </button>
        }
      />

      {error && <Card style={{ borderColor: 'var(--bad)' }}>Could not diagnose: {error}</Card>}
      {loading && <Card>Running diagnostics…</Card>}

      {data && (
        <>
          <div className="grid cols-4">
            <StatCard
              label="Status"
              value={
                data.report.summary.healthy ? (
                  <Badge tone="good">Healthy</Badge>
                ) : (
                  <Badge tone="bad">Issues</Badge>
                )
              }
            />
            <StatCard label="Errors" value={data.report.summary.errors} />
            <StatCard label="Warnings" value={data.report.summary.warnings} />
            <StatCard label="Info" value={data.report.summary.infos} />
          </div>

          <Card style={{ marginTop: 14, padding: 0, overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Category</th>
                  <th>Message</th>
                  <th>Path</th>
                </tr>
              </thead>
              <tbody>
                {data.report.diagnostics.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 24 }}>
                      No findings — your environment looks healthy.
                    </td>
                  </tr>
                ) : (
                  data.report.diagnostics.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <Badge tone={d.severity === 'error' ? 'bad' : d.severity === 'warning' ? 'warn' : undefined}>
                          {d.severity}
                        </Badge>
                      </td>
                      <td>{d.category}</td>
                      <td>{d.message}</td>
                      <td className="mono" style={{ color: 'var(--text-dim)' }}>
                        {d.path ?? '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
