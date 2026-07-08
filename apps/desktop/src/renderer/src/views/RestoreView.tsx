import { useState } from 'react';
import type { CemManifest } from '@cem/core';
import { cem, type RestorePlanResponse, type RestoreResponse } from '../cem-api.js';
import { PageHead, Card, Badge, Spinner } from '../components/common.js';
import { formatDate } from '../format.js';

export function RestoreView(): JSX.Element {
  const [path, setPath] = useState('');
  const [manifest, setManifest] = useState<CemManifest>();
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<RestorePlanResponse>();
  const [result, setResult] = useState<RestoreResponse>();
  const [overwrite, setOverwrite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function pick(): Promise<void> {
    reset();
    const file = await cem.pickFile([{ name: 'CEM archives', extensions: ['cem'] }]);
    if (!file) return;
    setPath(file);
    try {
      setManifest(await cem.readManifest(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function reset(): void {
    setManifest(undefined);
    setPlan(undefined);
    setResult(undefined);
    setError(undefined);
    setPassword('');
  }

  async function loadPlan(): Promise<void> {
    setError(undefined);
    setBusy(true);
    try {
      const response = await cem.restorePlan({
        path,
        ...(manifest?.encryption.enabled ? { password } : {}),
        options: { overwrite },
      });
      setPlan(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doRestore(): Promise<void> {
    setError(undefined);
    setBusy(true);
    try {
      const response = await cem.restore({
        path,
        ...(manifest?.encryption.enabled ? { password } : {}),
        options: { overwrite },
      });
      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const conflicts = plan?.plan.filter((p) => p.exists).length ?? 0;

  return (
    <div>
      <PageHead title="Restore" subtitle="Import a .cem archive onto this machine" />

      <Card>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="field" placeholder="Select a .cem file…" value={path} readOnly />
          <button className="btn" onClick={pick}>
            Choose file…
          </button>
        </div>

        {manifest && (
          <div style={{ marginTop: 14 }}>
            <Row k="Created" v={formatDate(manifest.createdAt)} />
            <Row k="Source OS" v={manifest.host.os} />
            <Row k="Format" v={manifest.formatVersion} />
            <Row k="Total files" v={String(manifest.contents.totalFiles)} />
            <Row
              k="Encrypted"
              v={manifest.encryption.enabled ? 'yes (AES-256-GCM)' : 'no'}
            />

            {manifest.encryption.enabled && (
              <>
                <label className="lbl">Password</label>
                <input
                  className="field"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ maxWidth: 320 }}
                />
              </>
            )}

            <div style={{ marginTop: 14 }}>
              <button className="btn" onClick={loadPlan} disabled={busy}>
                {busy && !plan ? <Spinner /> : 'Verify & preview'}
              </button>
            </div>
          </div>
        )}
      </Card>

      {error && (
        <Card style={{ marginTop: 14, borderColor: 'var(--bad)' }}>
          <strong style={{ color: 'var(--bad)' }}>Error:</strong> {error}
        </Card>
      )}

      {plan && (
        <Card style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0 }}>Restore preview</h3>
            {plan.verification.ok ? (
              <Badge tone="good">integrity verified</Badge>
            ) : (
              <Badge tone="bad">integrity failed</Badge>
            )}
          </div>

          <div style={{ margin: '10px 0' }}>
            {plan.plan.length} file(s) will be restored · {conflicts} already exist.
          </div>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
            Overwrite existing files
          </label>

          <div style={{ maxHeight: '34vh', overflow: 'auto', marginBottom: 12 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {plan.plan.slice(0, 200).map((item) => (
                  <tr key={item.targetPath}>
                    <td className="mono" style={{ fontSize: 12 }}>
                      {item.targetPath}
                    </td>
                    <td>{item.exists ? <Badge tone="warn">exists</Badge> : <Badge tone="good">new</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="btn primary"
            onClick={doRestore}
            disabled={busy || (!plan.verification.ok)}
          >
            {busy ? <Spinner /> : 'Restore now'}
          </button>
          {!plan.verification.ok && (
            <span style={{ color: 'var(--bad)', marginLeft: 10 }}>
              Restore is blocked because integrity verification failed.
            </span>
          )}
        </Card>
      )}

      {result && (
        <Card style={{ marginTop: 14, borderColor: 'var(--good)' }}>
          <h3 style={{ marginTop: 0 }}>Restore complete</h3>
          <Row k="Restored" v={String(result.result.restored.length)} />
          <Row k="Skipped (conflicts)" v={String(result.result.conflicts.length)} />
        </Card>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', gap: 16 }}>
      <span style={{ color: 'var(--text-dim)' }}>{k}</span>
      <span className="mono" style={{ wordBreak: 'break-all', textAlign: 'right' }}>
        {v}
      </span>
    </div>
  );
}
