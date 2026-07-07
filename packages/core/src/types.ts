import type { ArtifactKind } from '@cem/shared';

/** Where a discovered artifact lives in the Claude Code ecosystem. */
export type ArtifactScope = 'user' | 'project' | 'plugin' | 'desktop' | 'unknown';

/**
 * A single file or logical artifact discovered by the scanner. This is the
 * lingua franca that flows from scanner → managers → backup.
 */
export interface ScannedArtifact {
  readonly id: string;
  readonly kind: ArtifactKind;
  readonly scope: ArtifactScope;
  /** Absolute path on disk. */
  readonly path: string;
  /** Display name (file name, skill name, MCP server name, …). */
  readonly name: string;
  readonly size: number;
  readonly mtimeMs: number;
  /** SHA-256 of the file contents when computed. */
  readonly sha256?: string;
  /** Heuristic token estimate for text artifacts. */
  readonly tokens?: number;
  /** True when the artifact is known to potentially contain secrets. */
  readonly sensitive?: boolean;
  /** Arbitrary parsed metadata (front-matter, JSON fields, …). */
  readonly meta?: Record<string, unknown>;
}

/** A grouping of artifacts by category, plus scan-level diagnostics. */
export interface ScanResult {
  readonly scannedAt: string;
  readonly roots: readonly string[];
  readonly host: HostInfo;
  readonly artifacts: readonly ScannedArtifact[];
  readonly warnings: readonly string[];
}

/** Non-identifying host information captured for context. */
export interface HostInfo {
  readonly os: string;
  readonly platform: NodeJS.Platform | string;
  readonly arch: string;
  readonly nodeVersion: string;
  readonly claudeVersion?: string;
  /** Included only when the user opts in. */
  readonly hostname?: string;
}

/** A known Claude Code location the scanner probes. */
export interface KnownLocation {
  readonly label: string;
  readonly path: string;
  readonly kind: ArtifactKind;
  readonly scope: ArtifactScope;
  /** True for directories that should be walked for children. */
  readonly isDirectory: boolean;
  /** Marks locations that may hold credentials/secrets. */
  readonly sensitive: boolean;
}

// ---------------------------------------------------------------------------
// MCP domain
// ---------------------------------------------------------------------------

export type McpTransport = 'stdio' | 'sse' | 'http' | 'unknown';

/** A normalized MCP server definition parsed from a config file. */
export interface McpServerDefinition {
  readonly name: string;
  readonly transport: McpTransport;
  readonly command?: string;
  readonly args?: readonly string[];
  readonly url?: string;
  /** Environment variables (values may be redacted for display). */
  readonly env?: Readonly<Record<string, string>>;
  readonly scope: ArtifactScope;
  /** Absolute path of the config file this server was parsed from. */
  readonly sourcePath: string;
  readonly disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Skills / Agents domain
// ---------------------------------------------------------------------------

export interface SkillMetadata {
  readonly name: string;
  readonly description?: string;
  readonly author?: string;
  readonly version?: string;
  readonly path: string;
  readonly scope: ArtifactScope;
  readonly files: readonly string[];
  readonly tokens: number;
  readonly dependencies?: readonly string[];
}

export interface AgentMetadata {
  readonly name: string;
  readonly description?: string;
  readonly model?: string;
  readonly tools?: readonly string[];
  readonly path: string;
  readonly scope: ArtifactScope;
  readonly tokens: number;
  readonly enabled: boolean;
}

// ---------------------------------------------------------------------------
// Markdown domain
// ---------------------------------------------------------------------------

export interface MarkdownStats {
  readonly path: string;
  readonly name: string;
  readonly size: number;
  readonly lines: number;
  readonly tokens: number;
  readonly headings: number;
  /** Referenced files / links discovered in the document. */
  readonly references: readonly string[];
  readonly scope: ArtifactScope;
}

/** A detected content overlap between two markdown files. */
export interface MarkdownOverlap {
  readonly a: string;
  readonly b: string;
  /** Jaccard-like similarity in the range [0, 1]. */
  readonly similarity: number;
  readonly sharedLines: number;
}

// ---------------------------------------------------------------------------
// Profiles domain
// ---------------------------------------------------------------------------

export interface Profile {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Selection rules that decide which artifacts belong to the profile. */
  readonly include: ProfileSelection;
  readonly tags?: readonly string[];
}

export interface ProfileSelection {
  /** Artifact kinds to include. */
  readonly kinds?: readonly ArtifactKind[];
  /** Glob-like path fragments to include (substring match). */
  readonly paths?: readonly string[];
  /** Explicit artifact ids or names to include. */
  readonly names?: readonly string[];
  /** Scopes to include. */
  readonly scopes?: readonly ArtifactScope[];
}

// ---------------------------------------------------------------------------
// .cem archive manifest
// ---------------------------------------------------------------------------

export interface CemEncryptionHeader {
  readonly enabled: boolean;
  readonly algorithm?: 'AES-256-GCM';
  readonly kdf?: 'argon2id';
  /** Base64 KDF salt. */
  readonly salt?: string;
  /** Base64 AES-GCM IV/nonce. */
  readonly iv?: string;
  /** Base64 GCM authentication tag. */
  readonly authTag?: string;
  readonly kdfParams?: {
    readonly memoryCost: number;
    readonly timeCost: number;
    readonly parallelism: number;
  };
}

export interface CemContentSummary {
  readonly skills: number;
  readonly agents: number;
  readonly mcpServers: number;
  readonly markdownFiles: number;
  readonly plugins: number;
  readonly profiles: number;
  readonly commands: number;
  readonly configFiles: number;
  readonly totalFiles: number;
  readonly totalBytes: number;
}

/** The anchor a file is restored relative to on the target machine. */
export type RestoreBase = 'home' | 'project' | 'absolute';

/** How to place a file back on disk during a restore. */
export interface RestoreTarget {
  readonly base: RestoreBase;
  /** Path relative to the base anchor (POSIX-style separators). */
  readonly relative: string;
  /** For project-scoped files: a stable slug identifying the source project. */
  readonly projectSlug?: string;
  /** For project-scoped files: the original project root (for remap display). */
  readonly projectRoot?: string;
}

/** One entry in the archive's file table. */
export interface CemEntry {
  /** Path within the archive, e.g. `skills/my-skill/SKILL.md`. */
  readonly archivePath: string;
  readonly kind: ArtifactKind;
  readonly scope: ArtifactScope;
  readonly size: number;
  readonly sha256: string;
  /** Original absolute path (may be omitted for privacy). */
  readonly originalPath?: string;
  /** Where and how to restore this file. */
  readonly restore: RestoreTarget;
}

export interface CemManifest {
  readonly formatVersion: string;
  readonly cemVersion: string;
  readonly id: string;
  readonly createdAt: string;
  readonly host: HostInfo;
  readonly encryption: CemEncryptionHeader;
  readonly contents: CemContentSummary;
  readonly profilesIncluded: readonly string[];
  readonly notes?: string;
}

/** The detailed file table + checksums, stored inside the (possibly encrypted) payload. */
export interface CemPayloadIndex {
  readonly entries: readonly CemEntry[];
  /** Map of archivePath → sha256 for integrity verification. */
  readonly checksums: Readonly<Record<string, string>>;
}
