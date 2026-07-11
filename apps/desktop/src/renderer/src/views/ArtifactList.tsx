import { useMemo, useState } from 'react';
import type { ArtifactKind, ScannedArtifact } from '@cem/core';
import { cem } from '../cem-api.js';
import { PageHead, Card, Badge, Spinner, EmptyState, useAsync } from '../components/common.js';
import { formatBytes, formatNumber } from '../format.js';

export function ArtifactList({
  title,
  subtitle,
  kinds,
}: {
  title: string;
  subtitle?: string;
  kinds?: ArtifactKind[];
}): JSX.Element {
  const { data, loading, error, reload } = useAsync(() => cem.scan({ computeTokens: true }), []);
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');

  const artifacts = useMemo<ScannedArtifact[]>(() => {
    let list = (data?.artifacts ?? []) as ScannedArtifact[];
    if (kinds) list = list.filter((a) => kinds.includes(a.kind));
    if (kindFilter !== 'all') list = list.filter((a) => a.kind === kindFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || a.path.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => (b.tokens ?? 0) - (a.tokens ?? 0));
  }, [data, kinds, kindFilter, search]);

  const availableKinds = useMemo(() => {
    const set = new Set<string>();
    for (const a of (data?.artifacts ?? []) as ScannedArtifact[]) {
      if (!kinds || kinds.includes(a.kind)) set.add(a.kind);
    }
    return [...set].sort();
  }, [data, kinds]);

  return (
    <div>
      <PageHead
        title={title}
        subtitle={subtitle}
        actions={
          <button className="btn" onClick={reload} disabled={loading}>
            {loading ? <Spinner /> : 'Rescan'}
          </button>
        }
      />

      <div className="toolbar">
        <input
          className="field"
          style={{ maxWidth: 320 }}
          placeholder="Search name or path…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {!kinds && (
          <select
            className="field"
            style={{ maxWidth: 180 }}
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {availableKinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        )}
        <div className="spacer" />
        <span style={{ color: 'var(--text-dim)' }}>{artifacts.length} item(s)</span>
      </div>

      {error && <Card style={{ borderColor: 'var(--bad)' }}>Could not scan: {error}</Card>}
      {loading && <Card>Scanning…</Card>}

      {!loading && artifacts.length === 0 && <EmptyState>No matching artifacts found.</EmptyState>}

      {artifacts.length > 0 && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ maxHeight: '62vh', overflow: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Scope</th>
                  <th style={{ textAlign: 'right' }}>Size</th>
                  <th style={{ textAlign: 'right' }}>Tokens</th>
                  <th>Path</th>
                </tr>
              </thead>
              <tbody>
                {artifacts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.name} {a.sensitive ? <Badge tone="warn">sensitive</Badge> : null}
                    </td>
                    <td>{a.kind}</td>
                    <td>{a.scope}</td>
                    <td style={{ textAlign: 'right' }}>{formatBytes(a.size)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {a.tokens ? formatNumber(a.tokens) : '—'}
                    </td>
                    <td className="mono" style={{ color: 'var(--text-dim)' }}>
                      {a.path}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
