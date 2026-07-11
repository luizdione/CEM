import { useState } from 'react';
import type { Remediation, RemediationResult } from '@cem/diagnostics';
import { cem } from '../cem-api.js';
import { PageHead, Card, StatCard, Badge, Spinner, useAsync } from '../components/common.js';

export function DiagnosticsView(): JSX.Element {
  const { data, loading, error, reload } = useAsync(() => cem.diagnose({}), []);
  const [remediations, setRemediations] = useState<Remediation[]>();
  const [proposing, setProposing] = useState(false);
  const [results, setResults] = useState<Record<string, RemediationResult>>({});
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string>();
  const [bulkBusy, setBulkBusy] = useState(false);

  const automatic = (remediations ?? []).filter((r) => r.automatic);
  const pending = automatic.filter((r) => !results[r.id] && !ignored.has(r.id));
  const allSelected = pending.length > 0 && pending.every((r) => selected.has(r.id));

  const solve = async (): Promise<void> => {
    setProposing(true);
    setResults({});
    setIgnored(new Set());
    try {
      const proposals = await cem.remediationPropose({});
      setRemediations(proposals);
      // Pre-select every automatic fix so "Solve Problems" is one click away.
      setSelected(new Set(proposals.filter((r) => r.automatic).map((r) => r.id)));
    } catch {
      setRemediations([]);
    } finally {
      setProposing(false);
    }
  };

  const toggleAll = (checked: boolean): void => {
    setSelected(checked ? new Set(pending.map((r) => r.id)) : new Set());
  };

  const toggleOne = (id: string, checked: boolean): void => {
    setSelected((s) => {
      const next = new Set(s);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const accept = async (rem: Remediation): Promise<void> => {
    setBusyId(rem.id);
    try {
      const result = await cem.remediationApply(rem);
      setResults((r) => ({ ...r, [rem.id]: result }));
      reload();
    } finally {
      setBusyId(undefined);
    }
  };

  const solveSelected = async (): Promise<void> => {
    setBulkBusy(true);
    try {
      for (const rem of pending.filter((r) => selected.has(r.id))) {
        const result = await cem.remediationApply(rem);
        setResults((r) => ({ ...r, [rem.id]: result }));
      }
      reload();
    } finally {
      setBulkBusy(false);
    }
  };

  const ignore = (rem: Remediation): void => setIgnored((s) => new Set(s).add(rem.id));

  return (
    <div>
      <PageHead
        title="Diagnostics"
        subtitle="Detect problems and resolve them with per-fix approval"
        actions={
          <>
            <button className="btn primary" onClick={solve} disabled={proposing || loading}>
              {proposing ? <Spinner /> : 'Solve problems'}
            </button>
            <button className="btn" onClick={reload} disabled={loading}>
              {loading ? <Spinner /> : 'Run again'}
            </button>
          </>
        }
      />

      <div className="note" style={{ marginBottom: 14 }}>
        Fixes only ever touch your own Claude Code files. Every deletion is backed up to CEM’s trash
        first, and you approve each change. CEM never modifies Claude Code or runs system commands.
      </div>

      {error && <Card style={{ borderColor: 'var(--bad)' }}>Could not diagnose: {error}</Card>}
      {loading && <Card>Running diagnostics…</Card>}

      {remediations && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0 }}>Proposed fixes ({remediations.length})</h3>
            {pending.length > 0 && (
              <>
                <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
                  <input type="checkbox" checked={allSelected} onChange={(e) => toggleAll(e.target.checked)} />
                  Select all ({pending.length})
                </label>
                <button
                  className="btn primary"
                  disabled={bulkBusy || selected.size === 0}
                  onClick={solveSelected}
                >
                  {bulkBusy ? <Spinner /> : `Solve ${selected.size} selected`}
                </button>
              </>
            )}
          </div>

          {remediations.length === 0 ? (
            <p style={{ color: 'var(--text-dim)' }}>Nothing to fix — your environment looks healthy.</p>
          ) : (
            remediations.map((rem) => {
              const result = results[rem.id];
              const isIgnored = ignored.has(rem.id);
              return (
                <div
                  key={rem.id}
                  style={{ borderTop: '1px solid var(--border)', padding: '12px 0', opacity: isIgnored ? 0.5 : 1, marginTop: 10 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {rem.automatic && !result && !isIgnored ? (
                      <input
                        type="checkbox"
                        checked={selected.has(rem.id)}
                        onChange={(e) => toggleOne(rem.id, e.target.checked)}
                      />
                    ) : null}
                    <strong>{rem.title}</strong>
                    {rem.automatic ? (
                      rem.destructive ? <Badge tone="warn">auto · deletes</Badge> : <Badge tone="good">auto</Badge>
                    ) : (
                      <Badge>manual</Badge>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-dim)', margin: '6px 0' }}>{rem.detail}</p>

                  {result ? (
                    <div>
                      <Badge tone={result.applied ? 'good' : undefined}>
                        {result.applied ? 'applied' : 'no change'}
                      </Badge>{' '}
                      <span style={{ color: 'var(--text-dim)' }}>{result.message}</span>
                    </div>
                  ) : isIgnored ? (
                    <Badge>ignored</Badge>
                  ) : rem.automatic ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn primary" disabled={busyId === rem.id || bulkBusy} onClick={() => accept(rem)}>
                        {busyId === rem.id ? <Spinner /> : 'Accept'}
                      </button>
                      <button className="btn" onClick={() => ignore(rem)}>
                        Ignore
                      </button>
                    </div>
                  ) : (
                    <Badge>no automatic action</Badge>
                  )}
                </div>
              );
            })
          )}
        </Card>
      )}

      {data && (
        <>
          <div className="grid cols-4">
            <StatCard
              label="Status"
              value={
                data.report.summary.healthy ? <Badge tone="good">Healthy</Badge> : <Badge tone="bad">Issues</Badge>
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
