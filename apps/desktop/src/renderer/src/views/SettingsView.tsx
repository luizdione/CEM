import { useEffect, useState } from 'react';
import type { CemAppConfig } from '@cem/core';
import { cem, type UpdateStatus } from '../cem-api.js';
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
  const [update, setUpdate] = useState<UpdateStatus>();

  useEffect(() => {
    cem.getConfig().then(setConfig).catch(() => undefined);
    const unsubscribe = cem.onUpdateStatus(setUpdate);
    return unsubscribe;
  }, []);

  const checkUpdate = (): void => {
    setUpdate({ state: 'checking' });
    cem.updateCheck().then(setUpdate).catch(() => setUpdate({ state: 'error' }));
  };
  const downloadUpdate = (): void => {
    cem.updateDownload().then(setUpdate).catch(() => setUpdate({ state: 'error' }));
  };
  const installUpdate = (): void => void cem.updateInstall();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Updates</h3>
          <button className="btn" onClick={checkUpdate}>
            Check for updates
          </button>
          {update?.state === 'available' && (
            <button className="btn primary" onClick={downloadUpdate}>
              Download {update.version}
            </button>
          )}
          {update?.state === 'downloaded' && (
            <button className="btn primary" onClick={installUpdate}>
              Restart &amp; install
            </button>
          )}
          <span style={{ color: 'var(--text-dim)' }}>{describeUpdate(update)}</span>
        </div>

        {config && (
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={config.autoUpdate}
                onChange={(e) => save({ ...config, autoUpdate: e.target.checked })}
              />
              Check for updates automatically on launch
            </label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
              <input
                type="checkbox"
                checked={config.backupBeforeUpdate}
                onChange={(e) => save({ ...config, backupBeforeUpdate: e.target.checked })}
              />
              Create a backup before applying an update (rollback safety)
            </label>
          </div>
        )}
        {update?.preUpdateBackup && (
          <div className="note" style={{ marginTop: 10 }}>
            Pre‑update backup saved to <span className="mono">{update.preUpdateBackup}</span>. If an
            update misbehaves, reinstall the previous version and import this <span className="mono">.cem</span>.
          </div>
        )}
      </Card>

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

function describeUpdate(status: UpdateStatus | undefined): string {
  if (!status) return '';
  switch (status.state) {
    case 'dev':
      return 'Updates are only available in the installed app.';
    case 'checking':
      return 'Checking…';
    case 'available':
      return `Version ${status.version ?? ''} is available.`;
    case 'none':
      return 'You are on the latest version.';
    case 'backing-up':
      return 'Creating a backup of your environment before updating…';
    case 'downloading':
      return `Downloading… ${status.percent ?? 0}%`;
    case 'downloaded':
      return 'Update ready to install.';
    case 'error':
      return `Update error: ${status.message ?? 'unknown'}`;
    default:
      return '';
  }
}
