import { useCallback, useEffect, useState, type ReactNode } from 'react';

export function Spinner(): JSX.Element {
  return <span className="spin" aria-label="loading" />;
}

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }): JSX.Element {
  return (
    <div className="card" style={style}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  foot,
}: {
  label: string;
  value: ReactNode;
  foot?: ReactNode;
}): JSX.Element {
  return (
    <div className="card stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {foot !== undefined ? <div className="stat-foot">{foot}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: 'good' | 'warn' | 'bad';
}): JSX.Element {
  return <span className={`badge${tone ? ` ${tone}` : ''}`}>{children}</span>;
}

export function EmptyState({ children }: { children: ReactNode }): JSX.Element {
  return <div className="empty">{children}</div>;
}

export function PageHead({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}): JSX.Element {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="toolbar" style={{ margin: 0 }}>{actions}</div> : null}
    </div>
  );
}

export function Bar({ label, value, max }: { label: string; value: number; max: number }): JSX.Element {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bar-row">
      <div style={{ width: 120, color: 'var(--text-dim)' }}>{label}</div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div style={{ width: 70, textAlign: 'right' }} className="mono">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
  reload: () => void;
}

/** Run an async loader and expose loading/error/reload state. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const run = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);
    loader()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, deps);

  useEffect(run, [run]);

  return { data, loading, error, reload: run };
}
