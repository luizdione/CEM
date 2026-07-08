import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/ipc.js';

/** The typed API surface exposed to the renderer as `window.cem`. */
const api = {
  scan: (options?: unknown) => ipcRenderer.invoke(IPC.scan, options),
  diagnose: (options?: unknown) => ipcRenderer.invoke(IPC.diagnose, options),
  listMcp: (options?: unknown) => ipcRenderer.invoke(IPC.listMcp, options),
  listSkills: (options?: unknown) => ipcRenderer.invoke(IPC.listSkills, options),
  listAgents: (options?: unknown) => ipcRenderer.invoke(IPC.listAgents, options),
  tokens: (options?: unknown) => ipcRenderer.invoke(IPC.tokens, options),
  listProfiles: () => ipcRenderer.invoke(IPC.listProfiles),
  createProfile: (input: unknown) => ipcRenderer.invoke(IPC.createProfile, input),
  deleteProfile: (id: string) => ipcRenderer.invoke(IPC.deleteProfile, id),
  profileTemplates: () => ipcRenderer.invoke(IPC.profileTemplates),
  backup: (options?: unknown) => ipcRenderer.invoke(IPC.backup, options),
  readManifest: (path: string) => ipcRenderer.invoke(IPC.readManifest, path),
  verify: (args: unknown) => ipcRenderer.invoke(IPC.verify, args),
  restorePlan: (args: unknown) => ipcRenderer.invoke(IPC.restorePlan, args),
  restore: (args: unknown) => ipcRenderer.invoke(IPC.restore, args),
  pickFile: (filters?: unknown) => ipcRenderer.invoke(IPC.pickFile, filters),
  pickDirectory: () => ipcRenderer.invoke(IPC.pickDirectory),
  getConfig: () => ipcRenderer.invoke(IPC.getConfig),
  saveConfig: (config: unknown) => ipcRenderer.invoke(IPC.saveConfig, config),
  platformInfo: () => ipcRenderer.invoke(IPC.platformInfo),
  openExternal: (url: string) => ipcRenderer.invoke(IPC.openExternal, url),
  listHistory: () => ipcRenderer.invoke(IPC.listHistory),
  auditLog: (limit?: number) => ipcRenderer.invoke(IPC.auditLog, limit),
};

contextBridge.exposeInMainWorld('cem', api);

export type CemApi = typeof api;
