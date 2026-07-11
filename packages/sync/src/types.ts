export type SyncProviderId =
  | 'git'
  | 'gdrive'
  | 'onedrive'
  | 'dropbox'
  | 'nas'
  | 'local-server';

export interface SyncStatus {
  readonly provider: SyncProviderId;
  readonly path: string;
  readonly isRepo: boolean;
  readonly branch?: string;
  readonly remoteUrl?: string;
  readonly dirty: boolean;
  readonly ahead: number;
  readonly behind: number;
  readonly lastCommit?: {
    readonly hash: string;
    readonly message: string;
    readonly date: string;
  };
}

export interface SyncResult {
  readonly ok: boolean;
  readonly action: string;
  readonly message: string;
  readonly committed?: boolean;
  readonly pushed?: boolean;
}
