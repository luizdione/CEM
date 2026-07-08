import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { readText } from '@cem/shared';
import { getHostInfo, loadConfig, saveConfig, type CemAppConfig } from '@cem/core';
import { scanEnvironment, filterArtifacts, type ScanOptions } from '@cem/scanner';
import { diagnoseEnvironment } from '@cem/diagnostics';
import { discoverMcpServers, redactServers } from '@cem/mcp';
import { analyzeMarkdown, buildTokenReport, type MarkdownDoc } from '@cem/markdown';
import type { MarkdownStats } from '@cem/core';
import {
  loadProfiles,
  saveProfile,
  createProfile,
  deleteProfile,
  PROFILE_TEMPLATES,
  type CreateProfileInput,
} from '@cem/profiles';
import { backupEnvironment, type BackupEnvironmentOptions } from '@cem/backup';
import {
  readManifest,
  readCemArchive,
  verifyArchive,
  computeRestoreTargets,
  restoreArchive,
  type RestoreOptions,
} from '@cem/restore';
import { IPC } from '../shared/ipc.js';

const CEM_VERSION = '1.0.0';

async function tokenReport(options: ScanOptions) {
  const scan = await scanEnvironment({ ...options, computeTokens: true });
  const docs = filterArtifacts(scan.artifacts, {
    kinds: ['markdown', 'memory', 'prompt', 'template', 'skill', 'agent'],
  });
  const stats: MarkdownStats[] = [];
  const contents: MarkdownDoc[] = [];
  for (const doc of docs) {
    try {
      stats.push(await analyzeMarkdown(doc.path, doc.scope));
      contents.push({ path: doc.path, content: await readText(doc.path) });
    } catch {
      // skip unreadable
    }
  }
  return buildTokenReport(stats, contents);
}

/** Register all IPC handlers. Every handler is read-only unless the user acts. */
export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.scan, (_e, options: ScanOptions = {}) => scanEnvironment(options));
  ipcMain.handle(IPC.diagnose, (_e, options: ScanOptions = {}) => diagnoseEnvironment(options));
  ipcMain.handle(IPC.listMcp, async (_e, options = {}) =>
    redactServers(await discoverMcpServers(options)),
  );
  ipcMain.handle(IPC.tokens, (_e, options: ScanOptions = {}) => tokenReport(options));

  ipcMain.handle(IPC.listProfiles, () => loadProfiles());
  ipcMain.handle(IPC.createProfile, async (_e, input: CreateProfileInput) => {
    const profile = createProfile(input);
    await saveProfile(profile);
    return profile;
  });
  ipcMain.handle(IPC.deleteProfile, (_e, id: string) => deleteProfile(id));
  ipcMain.handle(IPC.profileTemplates, () => PROFILE_TEMPLATES);

  ipcMain.handle(IPC.backup, (_e, options: BackupEnvironmentOptions = {}) =>
    backupEnvironment({ ...options, cemVersion: CEM_VERSION }),
  );

  ipcMain.handle(IPC.readManifest, (_e, path: string) => readManifest(path));
  ipcMain.handle(IPC.verify, async (_e, { path, password }: { path: string; password?: string }) => {
    const archive = await readCemArchive(path, password);
    return { manifest: archive.manifest, verification: verifyArchive(archive) };
  });
  ipcMain.handle(
    IPC.restorePlan,
    async (_e, { path, password, options }: PlanArgs) => {
      const archive = await readCemArchive(path, password);
      const verification = verifyArchive(archive);
      const plan = await computeRestoreTargets(archive, options ?? {});
      return { manifest: archive.manifest, verification, plan };
    },
  );
  ipcMain.handle(IPC.restore, async (_e, { path, password, options }: PlanArgs) => {
    const archive = await readCemArchive(path, password);
    const verification = verifyArchive(archive);
    const result = await restoreArchive(archive, options ?? {});
    return { verification, result };
  });

  ipcMain.handle(IPC.pickFile, async (_e, filters?: Electron.FileFilter[]) => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win!, {
      properties: ['openFile'],
      filters: filters ?? [{ name: 'CEM archives', extensions: ['cem'] }],
    });
    return result.canceled ? null : result.filePaths[0];
  });
  ipcMain.handle(IPC.pickDirectory, async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win!, { properties: ['openDirectory', 'createDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle(IPC.getConfig, () => loadConfig());
  ipcMain.handle(IPC.saveConfig, (_e, config: CemAppConfig) => saveConfig(config));
  ipcMain.handle(IPC.platformInfo, () => ({
    host: getHostInfo({ includeHostname: true }),
    cemVersion: CEM_VERSION,
  }));
  ipcMain.handle(IPC.openExternal, (_e, url: string) => shell.openExternal(url));
}

interface PlanArgs {
  path: string;
  password?: string;
  options?: RestoreOptions;
}
