import type { McpServerDefinition, ScannedArtifact } from '@cem/core';

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export type DiagnosticCategory =
  | 'orphan'
  | 'mcp'
  | 'duplicate'
  | 'tokens'
  | 'config'
  | 'dependency'
  | 'environment';

export interface Diagnostic {
  readonly id: string;
  readonly severity: DiagnosticSeverity;
  readonly category: DiagnosticCategory;
  readonly message: string;
  readonly path?: string;
  readonly details?: Record<string, unknown>;
}

export interface DiagnosticInput {
  readonly artifacts: readonly ScannedArtifact[];
  readonly mcpServers?: readonly McpServerDefinition[];
  /** References found in docs that do not resolve to an existing file. */
  readonly missingReferences?: readonly { readonly from: string; readonly reference: string }[];
  readonly largeFileTokenThreshold?: number;
}

export interface DiagnosticReport {
  readonly generatedAt: string;
  readonly diagnostics: readonly Diagnostic[];
  readonly summary: {
    readonly errors: number;
    readonly warnings: number;
    readonly infos: number;
    readonly healthy: boolean;
  };
}

/**
 * Run a set of pure diagnostic checks over already-collected environment data.
 * No filesystem or process access happens here, which keeps it deterministic
 * and easy to test.
 */
export function runDiagnostics(input: DiagnosticInput): DiagnosticReport {
  const largeThreshold = input.largeFileTokenThreshold ?? 6000;
  const diagnostics: Diagnostic[] = [];

  if (input.artifacts.length === 0) {
    diagnostics.push({
      id: 'env-empty',
      severity: 'info',
      category: 'environment',
      message: 'No Claude Code artifacts were found. Is Claude Code installed and configured?',
    });
  }

  // --- MCP configuration validity ---
  for (const server of input.mcpServers ?? []) {
    if (server.disabled) {
      diagnostics.push({
        id: `mcp-disabled-${server.name}`,
        severity: 'info',
        category: 'mcp',
        message: `MCP server "${server.name}" is disabled.`,
        path: server.sourcePath,
      });
    }
    if (server.transport === 'stdio' && !server.command) {
      diagnostics.push({
        id: `mcp-nocommand-${server.name}`,
        severity: 'error',
        category: 'mcp',
        message: `MCP server "${server.name}" uses stdio but declares no command.`,
        path: server.sourcePath,
      });
    }
    if ((server.transport === 'http' || server.transport === 'sse') && !server.url) {
      diagnostics.push({
        id: `mcp-nourl-${server.name}`,
        severity: 'error',
        category: 'mcp',
        message: `MCP server "${server.name}" uses ${server.transport} but declares no url.`,
        path: server.sourcePath,
      });
    }
    if (server.transport === 'unknown') {
      diagnostics.push({
        id: `mcp-unknown-${server.name}`,
        severity: 'warning',
        category: 'mcp',
        message: `MCP server "${server.name}" has an unrecognized transport.`,
        path: server.sourcePath,
      });
    }
  }

  // --- Duplicate files (by content hash) ---
  const byHash = new Map<string, ScannedArtifact[]>();
  for (const artifact of input.artifacts) {
    if (!artifact.sha256) continue;
    const group = byHash.get(artifact.sha256);
    if (group) group.push(artifact);
    else byHash.set(artifact.sha256, [artifact]);
  }
  for (const [hash, group] of byHash) {
    if (group.length > 1) {
      diagnostics.push({
        id: `dup-${hash.slice(0, 8)}`,
        severity: 'warning',
        category: 'duplicate',
        message: `${group.length} files share identical content.`,
        details: { paths: group.map((g) => g.path) },
      });
    }
  }

  // --- Token bloat ---
  for (const artifact of input.artifacts) {
    if ((artifact.tokens ?? 0) >= largeThreshold) {
      diagnostics.push({
        id: `tokens-${artifact.id}`,
        severity: 'warning',
        category: 'tokens',
        message: `"${artifact.name}" is large (~${artifact.tokens} tokens).`,
        path: artifact.path,
        details: { tokens: artifact.tokens },
      });
    }
  }

  // --- Orphan references ---
  for (const missing of input.missingReferences ?? []) {
    diagnostics.push({
      id: `orphan-${missing.from}-${missing.reference}`,
      severity: 'warning',
      category: 'orphan',
      message: `"${missing.reference}" referenced by ${missing.from} does not exist.`,
      path: missing.from,
      details: { reference: missing.reference },
    });
  }

  const errors = diagnostics.filter((d) => d.severity === 'error').length;
  const warnings = diagnostics.filter((d) => d.severity === 'warning').length;
  const infos = diagnostics.filter((d) => d.severity === 'info').length;

  return {
    generatedAt: new Date().toISOString(),
    diagnostics,
    summary: { errors, warnings, infos, healthy: errors === 0 },
  };
}

export interface TokenRollup {
  readonly total: number;
  readonly byKind: Record<string, number>;
  readonly byScope: Record<string, number>;
}

/** Aggregate estimated tokens by artifact kind and scope. */
export function tokenRollup(artifacts: readonly ScannedArtifact[]): TokenRollup {
  const byKind: Record<string, number> = {};
  const byScope: Record<string, number> = {};
  let total = 0;
  for (const artifact of artifacts) {
    const tokens = artifact.tokens ?? 0;
    total += tokens;
    byKind[artifact.kind] = (byKind[artifact.kind] ?? 0) + tokens;
    byScope[artifact.scope] = (byScope[artifact.scope] ?? 0) + tokens;
  }
  return { total, byKind, byScope };
}
