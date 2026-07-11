import { useState } from 'react';
import { cem } from '../cem-api.js';
import { PageHead, Card, StatCard, Bar, Spinner, useAsync } from '../components/common.js';
import { formatNumber } from '../format.js';

export function TokensView(): JSX.Element {
  const { data, loading, error, reload } = useAsync(() => cem.tokens({}), []);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string>();

  const sendToClaude = async (): Promise<void> => {
    if (!data) return;
    setExporting(true);
    setExportNote(undefined);
    try {
      const body = [
        `Static analysis of ${data.totalFiles} document(s), ~${data.totalTokens.toLocaleString()} tokens total, ~${data.estimatedWastedTokens.toLocaleString()} estimated as redundant.`,
        '',
        '## Recommendations',
        '',
        ...data.recommendations.map((r, i) => `${i + 1}. ${r}`),
        '',
        data.largeFiles.length > 0 ? '## Heaviest files (shrink candidates)\n' : '',
        ...data.largeFiles.slice(0, 15).map((f) => `- \`${f.path}\` — ~${f.tokens.toLocaleString()} tokens, ${f.lines} lines`),
        '',
        data.overlaps.length > 0 ? '## Overlapping content (deduplicate)\n' : '',
        ...data.overlaps.slice(0, 15).map((o) => `- ${(o.similarity * 100).toFixed(0)}% similar: \`${o.a}\` ↔ \`${o.b}\``),
        '',
        '## Instructions for Claude Code',
        '',
        'Work through the recommendations above: trim or split the heavy files and merge the overlapping documents into single referenced sources. Show me a diff before saving each change.',
      ].join('\n');
      const result = await cem.planExport({
        title: 'CEM — Token analyzer cleanup plan',
        body,
        suggestedName: 'CEM-TOKENS-PLAN.md',
      });
      setExportNote(result.message);
    } catch (e) {
      setExportNote(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHead
        title="Token Analyzer"
        subtitle="Estimated token usage and context-waste detection"
        actions={
          <button className="btn" onClick={reload} disabled={loading}>
            {loading ? <Spinner /> : 'Recompute'}
          </button>
        }
      />

      <div className="note" style={{ marginBottom: 14 }}>
        Token counts are heuristic estimates for relative comparison only — CEM does not call any
        Anthropic tokenizer or API.
      </div>

      {error && <Card style={{ borderColor: 'var(--bad)' }}>Could not analyze: {error}</Card>}
      {loading && <Card>Analyzing documents…</Card>}

      {data && (
        <>
          <div className="grid cols-3">
            <StatCard label="Documents" value={formatNumber(data.totalFiles)} />
            <StatCard label="Total tokens" value={formatNumber(data.totalTokens)} />
            <StatCard label="Wasted (est.)" value={formatNumber(data.estimatedWastedTokens)} />
          </div>

          <div className="grid cols-2" style={{ marginTop: 14 }}>
            <Card>
              <h3 style={{ marginTop: 0 }}>Heaviest documents</h3>
              {data.files.slice(0, 12).map((f) => (
                <Bar key={f.path} label={f.name} value={f.tokens} max={data.files[0]?.tokens ?? 1} />
              ))}
            </Card>
            <Card>
              <h3 style={{ marginTop: 0 }}>Overlapping content</h3>
              {data.overlaps.length === 0 ? (
                <p style={{ color: 'var(--text-dim)' }}>No significant overlap detected.</p>
              ) : (
                data.overlaps.slice(0, 12).map((o, i) => (
                  <div key={i} style={{ margin: '8px 0' }}>
                    <strong>{(o.similarity * 100).toFixed(0)}%</strong>{' '}
                    <span className="mono" style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                      {shorten(o.a)} ↔ {shorten(o.b)}
                    </span>
                  </div>
                ))
              )}
            </Card>
          </div>

          <Card style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 style={{ margin: 0 }}>Recommendations</h3>
              <button className="btn primary" disabled={exporting} onClick={sendToClaude}>
                {exporting ? <Spinner /> : 'Send to Claude Code'}
              </button>
            </div>
            {exportNote && <div className="note" style={{ marginTop: 10 }}>{exportNote}</div>}
            {data.recommendations.map((rec, i) => (
              <p key={i} style={{ color: 'var(--text-dim)', margin: '6px 0' }}>
                • {rec}
              </p>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}

function shorten(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts.slice(-2).join('/');
}
