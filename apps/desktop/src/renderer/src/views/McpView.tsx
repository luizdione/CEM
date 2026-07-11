import { useState } from 'react';
import type { McpServerDefinition } from '@cem/core';
import { cem } from '../cem-api.js';
import { PageHead, Card, Badge, Spinner, EmptyState, useAsync } from '../components/common.js';

export function McpView(): JSX.Element {
  const { data, loading, error, reload } = useAsync(() => cem.listMcp({}), []);
  const servers = (data ?? []) as McpServerDefinition[];
  const [status, setStatus] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function withBusy(fn: () => Promise<void>): Promise<void> {
    setBusy(true);
    setStatus(undefined);
    try {
      await fn();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const doExport = () =>
    withBusy(async () => {
      const res = await cem.mcpExport({});
      if (res.ok) setStatus(`Exported ${res.count} server(s) to ${res.path}.`);
      else if (res.reason !== 'cancelled') setStatus('Nothing to export.');
    });

  const doImport = () =>
    withBusy(async () => {
      const res = await cem.mcpImport();
      if (res.ok) setStatus(`Imported into ${res.into}: ${res.added} added, ${res.skipped} skipped.`);
      else if (res.reason !== 'cancelled') setStatus('Import cancelled.');
    });

  const toggle = (s: McpServerDefinition) =>
    withBusy(async () => {
      const res = await cem.mcpToggle({ sourcePath: s.sourcePath, name: s.name, disabled: !s.disabled });
      if (res.ok) reload();
      else setStatus(res.reason === 'nested-config' ? 'This server lives in a nested config and cannot be edited here.' : 'Server not found.');
    });

  const remove = (s: McpServerDefinition) =>
    withBusy(async () => {
      if (!window.confirm(`Remove MCP server "${s.name}" from ${s.sourcePath}?`)) return;
      const res = await cem.mcpRemove({ sourcePath: s.sourcePath, name: s.name });
      if (res.ok) reload();
      else setStatus(res.reason === 'nested-config' ? 'This server lives in a nested config and cannot be edited here.' : 'Server not found.');
    });

  return (
    <div>
      <PageHead
        title="MCP Servers"
        subtitle="Discovered from documented config files. Secrets are masked."
        actions={
          <>
            <button className="btn" onClick={doExport} disabled={busy || servers.length === 0}>
              Export…
            </button>
            <button className="btn" onClick={doImport} disabled={busy}>
              Import…
            </button>
            <button className="btn" onClick={reload} disabled={loading}>
              {loading ? <Spinner /> : 'Refresh'}
            </button>
          </>
        }
      />

      <div className="note" style={{ marginBottom: 14 }}>
        CEM edits only your local config files (add/remove/enable) — it never starts, stops or
        executes an MCP server.
      </div>

      {status && (
        <Card style={{ marginBottom: 14 }}>
          {busy ? <Spinner /> : null} {status}
        </Card>
      )}
      {error && <Card style={{ borderColor: 'var(--bad)' }}>Could not read config: {error}</Card>}
      {loading && <Card>Reading MCP configuration…</Card>}
      {!loading && servers.length === 0 && (
        <EmptyState>No MCP servers found in the documented locations.</EmptyState>
      )}

      <div className="grid cols-2">
        {servers.map((server, i) => {
          const editable = !server.sourcePath.includes('#');
          return (
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
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn" disabled={busy || !editable} onClick={() => toggle(server)}>
                  {server.disabled ? 'Enable' : 'Disable'}
                </button>
                <button className="btn" disabled={busy || !editable} onClick={() => remove(server)}>
                  Remove
                </button>
                {!editable ? (
                  <span style={{ color: 'var(--text-dim)', fontSize: 12, alignSelf: 'center' }}>
                    nested config — edit the file directly
                  </span>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
