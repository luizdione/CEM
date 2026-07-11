import type { ScannedArtifact } from '@cem/core';
import { cem } from '../cem-api.js';
import { PageHead, Card, Badge, Spinner, EmptyState, useAsync } from '../components/common.js';
import { formatBytes } from '../format.js';

interface PluginGroup {
  name: string;
  files: number;
  bytes: number;
  scope: string;
}

function pluginName(path: string): string {
  const match = /[/\\]plugins[/\\]([^/\\]+)/.exec(path);
  return match?.[1] ?? 'plugin';
}

function groupPlugins(artifacts: ScannedArtifact[]): PluginGroup[] {
  const byPlugin = new Map<string, PluginGroup>();
  for (const a of artifacts) {
    if (a.kind !== 'plugin') continue;
    const name = pluginName(a.path);
    const group = byPlugin.get(name) ?? { name, files: 0, bytes: 0, scope: a.scope };
    group.files += 1;
    group.bytes += a.size;
    byPlugin.set(name, group);
  }
  return [...byPlugin.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function PluginsView(): JSX.Element {
  const { data, loading, error, reload } = useAsync(() => cem.scan({ computeTokens: false }), []);
  const plugins = groupPlugins((data?.artifacts ?? []) as ScannedArtifact[]);

  return (
    <div>
      <PageHead
        title="Plugins"
        subtitle="Claude Code plugins discovered under ~/.claude/plugins (read-only)"
        actions={
          <button className="btn" onClick={reload} disabled={loading}>
            {loading ? <Spinner /> : 'Rescan'}
          </button>
        }
      />

      <div className="note" style={{ marginBottom: 14 }}>
        CEM backs up and restores plugin files as data. It never installs, executes or modifies
        Claude Code plugins.
      </div>

      {error && <Card style={{ borderColor: 'var(--bad)' }}>Could not scan: {error}</Card>}
      {loading && <Card>Scanning…</Card>}
      {!loading && plugins.length === 0 && (
        <EmptyState>No plugins found under ~/.claude/plugins.</EmptyState>
      )}

      <div className="grid cols-3">
        {plugins.map((p) => (
          <Card key={p.name}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>{p.name}</strong>
              <Badge>{p.scope}</Badge>
            </div>
            <div style={{ color: 'var(--text-dim)', marginTop: 8, fontSize: 13 }}>
              {p.files} file(s) · {formatBytes(p.bytes)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
