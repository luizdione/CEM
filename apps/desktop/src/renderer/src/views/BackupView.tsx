import { useState } from 'react';
import type { BackupResult } from '@cem/backup';
import { cem } from '../cem-api.js';
import { PageHead, Card, Badge, Spinner } from '../components/common.js';
import { formatBytes } from '../format.js';

export function BackupView(): JSX.Element {
  const [outDir, setOutDir] = useState('');
  const [encrypt, setEncrypt] = useState(false);
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [includeProjects, setIncludeProjects] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BackupResult>();
  const [error, setError] = useState<string>();

  async function pickDir(): Promise<void> {
    const dir = await cem.pickDirectory();
    if (dir) setOutDir(dir);
  }

  async function run(): Promise<void> {
    setError(undefined);
    if (encrypt && !password) {
      setError('Please enter a password or disable encryption.');
      return;
    }
    setBusy(true);
    try {
      const res = await cem.backup({
        ...(outDir ? { outDir } : {}),
        ...(encrypt ? { password } : {}),
        ...(notes ? { notes } : {}),
        includeProjectHistory: includeProjects,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHead title="Backup" subtitle="Create a portable .cem archive of your environment" />

      <Card>
        <label className="lbl">Output folder</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="field"
            placeholder="Default: ~/CEM Backups"
            value={outDir}
            onChange={(e) => setOutDir(e.target.value)}
          />
          <button className="btn" onClick={pickDir}>
            Browse…
          </button>
        </div>

        <label className="lbl">Notes (optional)</label>
        <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} />
            Encrypt with AES-256-GCM
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={includeProjects}
              onChange={(e) => setIncludeProjects(e.target.checked)}
            />
            Include project history
          </label>
        </div>

        {encrypt && (
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

        <div style={{ marginTop: 16 }}>
          <button className="btn primary" onClick={run} disabled={busy}>
            {busy ? <Spinner /> : 'Create backup'}
          </button>
        </div>
      </Card>

      {error && (
        <Card style={{ marginTop: 14, borderColor: 'var(--bad)' }}>
          <strong style={{ color: 'var(--bad)' }}>Backup failed:</strong> {error}
        </Card>
      )}

      {result && (
        <Card style={{ marginTop: 14, borderColor: 'var(--good)' }}>
          <h3 style={{ marginTop: 0 }}>
            Backup created {result.encrypted ? <Badge tone="good">encrypted</Badge> : null}
          </h3>
          <Row k="File" v={result.path} />
          <Row k="Size" v={formatBytes(result.bytes)} />
          <Row k="Files included" v={String(result.fileCount)} />
          {result.skipped.length > 0 ? <Row k="Skipped" v={String(result.skipped.length)} /> : null}
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
