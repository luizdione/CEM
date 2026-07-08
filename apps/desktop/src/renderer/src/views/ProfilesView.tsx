import { useState } from 'react';
import type { Profile } from '@cem/core';
import type { CreateProfileInput } from '@cem/profiles';
import { cem } from '../cem-api.js';
import { PageHead, Card, Badge, Spinner, EmptyState, useAsync } from '../components/common.js';

export function ProfilesView(): JSX.Element {
  const profiles = useAsync(() => cem.listProfiles(), []);
  const templates = useAsync(() => cem.profileTemplates(), []);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('');
  const [busy, setBusy] = useState(false);

  const templateList = (templates.data ?? []) as CreateProfileInput[];
  const list = (profiles.data ?? []) as Profile[];

  async function create(): Promise<void> {
    const base = templateList.find((t) => t.name === template);
    const finalName = name.trim() || base?.name;
    if (!finalName) return;
    setBusy(true);
    try {
      await cem.createProfile({
        name: finalName,
        ...(base?.description ? { description: base.description } : {}),
        include: base?.include ?? {},
      });
      setName('');
      setTemplate('');
      profiles.reload();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string): Promise<void> {
    await cem.deleteProfile(id);
    profiles.reload();
  }

  return (
    <div>
      <PageHead
        title="Profiles"
        subtitle="Activate a subset of your configuration and documentation per workflow"
      />

      <Card style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>Create a profile</h3>
        <div className="grid cols-3" style={{ alignItems: 'end' }}>
          <div>
            <label className="lbl">Name</label>
            <input
              className="field"
              placeholder="e.g. Bioinformatics"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="lbl">From template (optional)</label>
            <select className="field" value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="">— none —</option>
              {templateList.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn primary" onClick={create} disabled={busy}>
            {busy ? <Spinner /> : 'Create profile'}
          </button>
        </div>
      </Card>

      {profiles.loading && <Card>Loading profiles…</Card>}
      {!profiles.loading && list.length === 0 && (
        <EmptyState>No profiles yet. Create one above from a template.</EmptyState>
      )}

      <div className="grid cols-2">
        {list.map((p) => (
          <Card key={p.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 15 }}>{p.name}</strong>
              <button className="btn" onClick={() => remove(p.id)}>
                Delete
              </button>
            </div>
            {p.description ? (
              <p style={{ color: 'var(--text-dim)', margin: '8px 0' }}>{p.description}</p>
            ) : null}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(p.include.kinds ?? []).map((k) => (
                <Badge key={k}>{k}</Badge>
              ))}
              {(p.include.paths ?? []).map((path) => (
                <Badge key={path}>path:{path}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
