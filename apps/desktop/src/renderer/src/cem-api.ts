import type {
  AuditEntry,
  BackupRecord,
  CemAppConfig,
  CemManifest,
  HostInfo,
  McpServerDefinition,
  Profile,
  ProfileSelection,
  ScanResult,
} from '@cem/core';
import type { CreateProfileInput } from '@cem/profiles';
import type { EnvironmentDiagnosis } from '@cem/diagnostics';
import type { TokenReport } from '@cem/markdown';
import type { BackupResult } from '@cem/backup';
import type { VerifyResult, RestorePlanItem, RestoreResult } from '@cem/restore';

export interface BackupRequest {
  outDir?: string;
  fileName?: string;
  password?: string;
  notes?: string;
  includeProjectHistory?: boolean;
  discoverProjects?: boolean;
  profilesIncluded?: string[];
}

export interface RestoreRequestOptions {
  home?: string;
  kinds?: string[];
  overwrite?: boolean;
  dryRun?: boolean;
  projectBaseDir?: string;
  externalBaseDir?: string;
}

export interface VerifyResponse {
  manifest: CemManifest;
  verification: VerifyResult;
}

export interface RestorePlanResponse extends VerifyResponse {
  plan: RestorePlanItem[];
}

export interface RestoreResponse {
  verification: VerifyResult;
  result: RestoreResult;
}

/** The API bridged from the main process via the preload script. */
export interface CemApi {
  scan(options?: Record<string, unknown>): Promise<ScanResult>;
  diagnose(options?: Record<string, unknown>): Promise<EnvironmentDiagnosis>;
  listMcp(options?: Record<string, unknown>): Promise<McpServerDefinition[]>;
  tokens(options?: Record<string, unknown>): Promise<TokenReport>;
  listProfiles(): Promise<Profile[]>;
  createProfile(input: CreateProfileInput): Promise<Profile>;
  deleteProfile(id: string): Promise<boolean>;
  profileTemplates(): Promise<CreateProfileInput[]>;
  backup(options?: BackupRequest): Promise<BackupResult>;
  readManifest(path: string): Promise<CemManifest>;
  verify(args: { path: string; password?: string }): Promise<VerifyResponse>;
  restorePlan(args: {
    path: string;
    password?: string;
    options?: RestoreRequestOptions;
  }): Promise<RestorePlanResponse>;
  restore(args: {
    path: string;
    password?: string;
    options?: RestoreRequestOptions;
  }): Promise<RestoreResponse>;
  pickFile(filters?: { name: string; extensions: string[] }[]): Promise<string | null>;
  pickDirectory(): Promise<string | null>;
  getConfig(): Promise<CemAppConfig>;
  saveConfig(config: CemAppConfig): Promise<void>;
  platformInfo(): Promise<{ host: HostInfo; cemVersion: string }>;
  openExternal(url: string): Promise<void>;
  listHistory(): Promise<BackupRecord[]>;
  auditLog(limit?: number): Promise<AuditEntry[]>;
}

declare global {
  interface Window {
    cem: CemApi;
  }
}

export const cem: CemApi = window.cem;

export type { ProfileSelection };
