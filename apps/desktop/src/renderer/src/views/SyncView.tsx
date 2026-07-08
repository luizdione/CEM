import { useEffect, useState } from 'react';
import type { SyncStatus } from '@cem/sync';
import { cem } from '../cem-api.js';
import { PageHead, Card, Badge, Spinner } from '../components/common.js';
import { formatDate } from '../format.js';

export function SyncView(): JSX.Element {
  const [status, setStatus] = useState<SyncStatus>();
  const [remote, setRemote] = useState('');
  const [message, setMessage] = useState('CEM backup sync');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string>();

  const refresh = (): void => {
    cem.syncStatus().then(setStatus).catch(() => undefined);
  };
  useEffect(refresh, []);
  useEffect(() => {
    if (status?.remoteUrl) setRemote(status.remoteUrl);
  }, [status?.remoteUrl]);

  async function run(fn: () => Promise<{ ok: boolean; message: string }>): Promise<void> {
    setBusy(true);
    setNote(undefined);
    try {
      const res = await fn();
      setNote(res.message);
      refresh();
    } catch (e) {
      setNote(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const doInit = () => run(() => cem.syncInit(remote || undefined));
  const doPush = () => {
    if (!window.confirm('Pushing uploads your .cem backups to the remote. Encrypt sensitive backups first. Continue?'))
      return Promise.resolve();
    return run(() => cem.syncPush({ message, push: true }));
  };
  const doCommit = () => run(() => cem.syncPush({ message, push: false }));
  const doPull = () => run(() => cem.syncPull());

  return (
    <div>
      <PageHead
        title="Sync"
        subtitle="Optional Git synchronization of your backups — never automatic"
        actions={
          <button className="btn" onClick={refresh} disabled={busy}>
            {busy ? <Spinner /> : 'Refresh'}
          </button>
        }
      />

      <div className="note" style={{ marginBottom: 14 }}>
        CEM only pushes when you explicitly click <strong>Commit &amp; push</strong>. Backups may
        contain secrets — encrypt them before syncing to a remote. CEM does not manage git
        credentials; your existing git setup is used.
      </div>

      <Card>
        <h3 style={{ marginTop: 0 }}>Backups repository</h3>
        {!status ? (
          <Spinner />
        ) : (
          <>
            <Row k="Directory" v={status.path} />
            <Row k="Repository" v={status.isRepo ? 'initialized' : 'not initialized'} />
            {status.isRepo && (
              <>
                <Row k="Branch" v={status.branch ?? '—'} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                  <span style={{ color: 'var(--text-dim)' }}>State</span>
                  <span>
                    {status.dirty ? <Badge tone="warn">uncommitted changes</Badge> : <Badge tone="good">clean</Badge>}{' '}
                    <Badge>↑{status.ahead}</Badge> <Badge>↓{status.behind}</Badge>
                  </span>
                </div>
                {status.lastCommit && (
                  <Row k="Last commit" v={`${status.lastCommit.message} · ${formatDate(status.lastCommit.date)}`} />
                )}
              </>
            )}

            <label className="lbl">Remote URL</label>
            <input
              className="field"
              placeholder="git@github.com:you/cem-backups.git"
              value={remote}
              onChange={(e) => setRemote(e.target.value)}
            />

            <label className="lbl">Commit message</label>
            <input className="field" value={message} onChange={(e) => setMessage(e.target.value)} />

            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button className="btn" onClick={doInit} disabled={busy}>
                {status.isRepo ? 'Set remote' : 'Initialize'}
              </button>
              <button className="btn" onClick={doCommit} disabled={busy || !status.isRepo}>
                Commit only
              </button>
              <button className="btn primary" onClick={doPush} disabled={busy || !status.isRepo}>
                Commit &amp; push
              </button>
              <button className="btn" onClick={doPull} disabled={busy || !status.isRepo || !status.remoteUrl}>
                Pull
              </button>
            </div>
          </>
        )}
      </Card>

      {note && (
        <Card style={{ marginTop: 14 }}>
          {busy ? <Spinner /> : null} {note}
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
