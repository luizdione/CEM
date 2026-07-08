import { useEffect, useState } from 'react';
import { Sidebar, type NavGroup } from './components/Sidebar.js';
import { cem } from './cem-api.js';
import { Dashboard } from './views/Dashboard.js';
import { ArtifactList } from './views/ArtifactList.js';
import { ManagerView } from './views/ManagerView.js';
import { McpView } from './views/McpView.js';
import { PluginsView } from './views/PluginsView.js';
import { ProfilesView } from './views/ProfilesView.js';
import { DiagnosticsView } from './views/DiagnosticsView.js';
import { TokensView } from './views/TokensView.js';
import { BackupView } from './views/BackupView.js';
import { RestoreView } from './views/RestoreView.js';
import { HistoryView } from './views/HistoryView.js';
import { SettingsView } from './views/SettingsView.js';

const NAV: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '◆' },
      { id: 'scanner', label: 'Scanner', icon: '⌕' },
      { id: 'diagnostics', label: 'Diagnostics', icon: '✚' },
      { id: 'tokens', label: 'Token Analyzer', icon: '∑' },
    ],
  },
  {
    group: 'Managers',
    items: [
      { id: 'mcp', label: 'MCP Servers', icon: '⇄' },
      { id: 'skills', label: 'Skills', icon: '✦' },
      { id: 'agents', label: 'Agents', icon: '◈' },
      { id: 'markdown', label: 'Markdown', icon: '¶' },
      { id: 'plugins', label: 'Plugins', icon: '⧉' },
      { id: 'profiles', label: 'Profiles', icon: '☰' },
    ],
  },
  {
    group: 'Migration',
    items: [
      { id: 'backup', label: 'Backup', icon: '⤓' },
      { id: 'restore', label: 'Restore', icon: '⤒' },
      { id: 'history', label: 'History', icon: '⟲' },
    ],
  },
  { group: 'System', items: [{ id: 'settings', label: 'Settings', icon: '⚙' }] },
];

export function App(): JSX.Element {
  const [active, setActive] = useState('dashboard');
  const [version, setVersion] = useState('1.0.0');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    cem
      .platformInfo()
      .then((info) => setVersion(info.cemVersion))
      .catch(() => undefined);
    cem
      .getConfig()
      .then((config) => {
        if (config.theme === 'light' || config.theme === 'dark') setTheme(config.theme);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app">
      <Sidebar groups={NAV} active={active} onSelect={setActive} version={version} />
      <main className="content">
        {active === 'dashboard' && <Dashboard onNavigate={setActive} />}
        {active === 'scanner' && <ArtifactList title="Scanner" subtitle="Every discovered artifact" />}
        {active === 'skills' && <ManagerView mode="skills" />}
        {active === 'agents' && <ManagerView mode="agents" />}
        {active === 'markdown' && (
          <ArtifactList
            title="Markdown"
            subtitle="CLAUDE.md, memory and related documents"
            kinds={['markdown', 'memory', 'prompt', 'template']}
          />
        )}
        {active === 'mcp' && <McpView />}
        {active === 'plugins' && <PluginsView />}
        {active === 'profiles' && <ProfilesView />}
        {active === 'diagnostics' && <DiagnosticsView />}
        {active === 'tokens' && <TokensView />}
        {active === 'backup' && <BackupView />}
        {active === 'restore' && <RestoreView />}
        {active === 'history' && <HistoryView />}
        {active === 'settings' && <SettingsView theme={theme} onThemeChange={setTheme} />}
      </main>
    </div>
  );
}
