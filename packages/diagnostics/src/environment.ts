import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { pathExists, readText } from '@cem/shared';
import type { McpServerDefinition, ScanResult } from '@cem/core';
import { scanEnvironment, discoverProjectRoots, type ScanOptions } from '@cem/scanner';
import { discoverMcpServers } from '@cem/mcp';
import { extractReferences } from '@cem/markdown';
import {
  runDiagnostics,
  tokenRollup,
  type DiagnosticReport,
  type TokenRollup,
} from './diagnose.js';

export interface DiagnoseEnvironmentOptions extends ScanOptions {
  readonly largeFileTokenThreshold?: number;
}

export interface EnvironmentDiagnosis {
  readonly report: DiagnosticReport;
  readonly scan: ScanResult;
  readonly mcpServers: readonly McpServerDefinition[];
  readonly rollup: TokenRollup;
}

const MARKDOWN_KINDS = new Set(['markdown', 'memory', 'prompt', 'template', 'skill', 'agent']);

/**
 * Perform a full, read-only environment diagnosis: scan artifacts, discover MCP
 * servers, resolve document references and run all diagnostic checks.
 */
export async function diagnoseEnvironment(
  options: DiagnoseEnvironmentOptions = {},
): Promise<EnvironmentDiagnosis> {
  const home = options.home ?? homedir();

  const explicitRoots = options.projectRoots ?? [];
  const discovered =
    (options.discoverProjects ?? true) ? await discoverProjectRoots(home) : [];
  const projectRoots = [...new Set([...explicitRoots, ...discovered])];

  const scan = await scanEnvironment({
    ...options,
    computeHashes: true,
    computeTokens: true,
  });

  const mcpServers = await discoverMcpServers({
    home,
    ...(options.platform ? { platform: options.platform } : {}),
    ...(options.env ? { env: options.env } : {}),
    projectRoots,
  });

  const missingReferences: { from: string; reference: string }[] = [];
  for (const artifact of scan.artifacts) {
    if (!MARKDOWN_KINDS.has(artifact.kind)) continue;
    let content: string;
    try {
      content = await readText(artifact.path);
    } catch {
      continue;
    }
    for (const reference of extractReferences(content)) {
      if (/^[a-z]+:\/\//i.test(reference)) continue;
      const resolved = resolve(dirname(artifact.path), reference);
      if (!(await pathExists(resolved))) {
        missingReferences.push({ from: artifact.path, reference });
      }
    }
  }

  const report = runDiagnostics({
    artifacts: scan.artifacts,
    mcpServers,
    missingReferences,
    ...(options.largeFileTokenThreshold !== undefined
      ? { largeFileTokenThreshold: options.largeFileTokenThreshold }
      : {}),
  });

  return { report, scan, mcpServers, rollup: tokenRollup(scan.artifacts) };
}
