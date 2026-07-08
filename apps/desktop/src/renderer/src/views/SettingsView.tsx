import { useEffect, useState } from 'react';
import type { CemAppConfig } from '@cem/core';
import { cem } from '../cem-api.js';
import { PageHead, Card, Badge, Spinner } from '../components/common.js';

export function SettingsView({
  theme,
  onThemeChange,
}: {
  theme: 'dark' | 'light';
  onThemeChange: (t: 'dark' | 'light') => void;
}): JSX.Element {
  const [config, setConfig] = useState<CemAppConfig>();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    cem.getConfig().then(setConfig).catch(() => undefined);
  }, []);

  async function save(next: CemAppConfig): Promise<void> {
    setConfig(next);
    await cem.saveConfig(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function setTheme(t: 'dark' | 'light'): void {
    onThemeChange(t);
    if (config) void save({ ...config, theme: t });
  }

  return (
    <div>
      <PageHead
        title="Settings"
        subtitle="Preferences for the Claude Environment Manager"
        actions={saved ? <Badge tone="good">saved</Badge> : undefined}
      />

      <div className="grid cols-2">
        <Card>
          <h3 style={{ marginTop: 0 }}>Appearance</h3>
          <label className="lbl">Theme</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn${theme === 'dark' ? ' primary' : ''}`}
              onClick={() => setTheme('dark')}
            >
              Dark
            </button>
            <button
              className={`btn${theme === 'light' ? ' primary' : ''}`}
              onClick={() => setTheme('light')}
            >
              Light
            </button>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Backup defaults</h3>
          {!config ? (
            <Spinner />
          ) : (
            <>
              <label className="lbl">Default backup folder</label>
              <input
                className="field"
                value={config.defaultBackupDir}
                onChange={(e) => save({ ...config, defaultBackupDir: e.target.value })}
              />
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
                <input
                  type="checkbox"
                  checked={config.encryptionByDefault}
                  onChange={(e) => save({ ...config, encryptionByDefault: e.target.checked })}
                />
                Encrypt backups by default
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <input
                  type="checkbox"
                  checked={config.includeProjectsByDefault}
                  onChange={(e) => save({ ...config, includeProjectsByDefault: e.target.checked })}
                />
                Include project history by default
              </label>
            </>
          )}
        </Card>
      </div>

      <Card style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Privacy &amp; compliance</h3>
        <p style={{ color: 'var(--text-dim)' }}>
          CEM collects <strong>no telemetry</strong>. It reads only documented, user-owned Claude
          Code files and never modifies, reverse-engineers or intercepts any Anthropic software. All
          data stays on your machine unless you explicitly export a <span className="mono">.cem</span>{' '}
          file.
        </p>
        <button className="btn" onClick={() => cem.openExternal('https://github.com/luizdione/CEM')}>
          Project on GitHub
        </button>
      </Card>
    </div>
  );
}
