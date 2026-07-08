import type { AuditEntry, BackupRecord } from '@cem/core';
import { cem } from '../cem-api.js';
import { PageHead, Card, Badge, Spinner, EmptyState, useAsync } from '../components/common.js';
import { formatBytes, formatDate } from '../format.js';

export function HistoryView(): JSX.Element {
  const { data, loading, error, reload } = useAsync(async () => {
    const [history, audit] = await Promise.all([cem.listHistory(), cem.auditLog(100)]);
    return { history, audit };
  }, []);

  const history = (data?.history ?? []) as BackupRecord[];
  const audit = ((data?.audit ?? []) as AuditEntry[]).slice().reverse();

  return (
    <div>
      <PageHead
        title="History"
        subtitle="Backups you have created and a log of CEM operations"
        actions={
          <button className="btn" onClick={reload} disabled={loading}>
            {loading ? <Spinner /> : 'Refresh'}
          </button>
        }
      />

      {error && <Card style={{ borderColor: 'var(--bad)' }}>Could not load history: {error}</Card>}

      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <strong>Backups ({history.length})</strong>
        </div>
        {history.length === 0 ? (
          <EmptyState>No backups recorded yet. Create one from the Backup view.</EmptyState>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Created</th>
                <th>Files</th>
                <th style={{ textAlign: 'right' }}>Size</th>
                <th>Encrypted</th>
                <th>Path</th>
              </tr>
            </thead>
            <tbody>
              {history.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>{r.fileCount}</td>
                  <td style={{ textAlign: 'right' }}>{formatBytes(r.bytes)}</td>
                  <td>{r.encrypted ? <Badge tone="good">yes</Badge> : <Badge>no</Badge>}</td>
                  <td className="mono" style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                    {r.path}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <strong>Audit log</strong>
        </div>
        {audit.length === 0 ? (
          <EmptyState>No operations recorded yet.</EmptyState>
        ) : (
          <div style={{ maxHeight: '40vh', overflow: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Result</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((e, i) => (
                  <tr key={`${e.timestamp}-${i}`}>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {formatDate(e.timestamp)}
                    </td>
                    <td>{e.action}</td>
                    <td>{e.ok ? <Badge tone="good">ok</Badge> : <Badge tone="bad">error</Badge>}</td>
                    <td className="mono" style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                      {e.message ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
