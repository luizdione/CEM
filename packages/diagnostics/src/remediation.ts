import { basename, join } from 'node:path';
import { copyFileEnsured, fileTimestamp, pathExists, removePath, writeText } from '@cem/shared';
import { getCemDataDir, type PathEnv } from '@cem/core';
import { removeServer, setServerDisabled } from '@cem/mcp';
import type { Diagnostic, DiagnosticReport } from './diagnose.js';

export type RemediationAction =
  | { readonly type: 'remove-mcp-server'; readonly configPath: string; readonly name: string }
  | { readonly type: 'disable-mcp-server'; readonly configPath: string; readonly name: string }
  | { readonly type: 'delete-duplicates'; readonly keep: string; readonly remove: readonly string[] }
  | { readonly type: 'create-stub'; readonly path: string }
  | { readonly type: 'manual' };

export interface Remediation {
  readonly id: string;
  readonly diagnosticId: string;
  readonly category: Diagnostic['category'];
  readonly title: string;
  readonly detail: string;
  /** True when CEM can apply the fix itself. */
  readonly automatic: boolean;
  /** True when applying deletes or overwrites files (a backup is taken first). */
  readonly destructive: boolean;
  readonly action: RemediationAction;
}

export interface RemediationResult {
  readonly id: string;
  readonly ok: boolean;
  readonly applied: boolean;
  readonly message: string;
  /** Where affected files were backed up before a destructive change. */
  readonly backup?: readonly string[];
}

/**
 * Turn a diagnostic report into concrete, reviewable fix proposals. Automatic
 * fixes can be applied by CEM; the rest carry guidance for the user.
 */
export function proposeRemediations(report: DiagnosticReport): Remediation[] {
  const out: Remediation[] = [];

  for (const d of report.diagnostics) {
    const server = typeof d.details?.server === 'string' ? d.details.server : undefined;
    const nested = d.path?.includes('#') ?? false;

    if (d.category === 'mcp' && d.severity === 'error' && server && d.path) {
      if (nested) {
        out.push(manual(d, `Fix "${server}" directly in ${d.path} (nested project config).`));
      } else {
        out.push({
          id: `fix-${d.id}`,
          diagnosticId: d.id,
          category: d.category,
          title: `Remove broken MCP server "${server}"`,
          detail: `The server "${server}" is misconfigured and cannot run. CEM will remove it from ${d.path} (a backup is kept).`,
          automatic: true,
          destructive: true,
          action: { type: 'remove-mcp-server', configPath: d.path, name: server },
        });
      }
      continue;
    }

    if (d.category === 'duplicate' && Array.isArray(d.details?.paths)) {
      const paths = (d.details.paths as unknown[]).filter((p): p is string => typeof p === 'string');
      if (paths.length > 1) {
        const [keep, ...remove] = paths;
        out.push({
          id: `fix-${d.id}`,
          diagnosticId: d.id,
          category: d.category,
          title: `De-duplicate ${paths.length} identical files`,
          detail: `Keep ${keep} and remove ${remove.length} identical copy(ies). Removed files are backed up first.`,
          automatic: true,
          destructive: true,
          action: { type: 'delete-duplicates', keep: keep!, remove },
        });
      }
      continue;
    }

    if (d.category === 'orphan' && d.path && typeof d.details?.reference === 'string') {
      out.push({
        id: `fix-${d.id}`,
        diagnosticId: d.id,
        category: d.category,
        title: `Create missing file "${d.details.reference}"`,
        detail: `${d.path} references "${d.details.reference}", which does not exist. CEM can create it as an empty stub so the reference resolves, or you can remove the reference manually.`,
        automatic: true,
        destructive: false,
        action: { type: 'create-stub', path: resolveReference(d.path, String(d.details.reference)) },
      });
      continue;
    }

    if (d.category === 'tokens') {
      out.push(
        manual(d, `"${basename(d.path ?? '')}" is large. Split it into smaller files or trim redundant sections.`),
      );
      continue;
    }
  }

  return out;
}

function manual(d: Diagnostic, detail: string): Remediation {
  return {
    id: `fix-${d.id}`,
    diagnosticId: d.id,
    category: d.category,
    title: 'Manual fix recommended',
    detail,
    automatic: false,
    destructive: false,
    action: { type: 'manual' },
  };
}

function resolveReference(from: string, reference: string): string {
  const dir = from.slice(0, Math.max(from.lastIndexOf('/'), from.lastIndexOf('\\')));
  if (reference.startsWith('/') || /^[A-Za-z]:[\\/]/.test(reference)) return reference;
  return join(dir, reference);
}

async function trash(filePath: string, env?: PathEnv): Promise<string> {
  const dir = join(getCemDataDir(env), 'trash', fileTimestamp());
  const safeName = filePath.replace(/[/\\:]+/g, '_');
  const dest = join(dir, safeName || basename(filePath));
  await copyFileEnsured(filePath, dest);
  return dest;
}

/** Apply a single remediation. Destructive actions back up files to CEM's trash first. */
export async function applyRemediation(
  remediation: Remediation,
  env?: PathEnv,
): Promise<RemediationResult> {
  const { action, id } = remediation;
  try {
    switch (action.type) {
      case 'manual':
        return { id, ok: true, applied: false, message: 'Manual fix — no changes made.' };

      case 'create-stub': {
        if (await pathExists(action.path)) {
          return { id, ok: true, applied: false, message: 'File already exists.' };
        }
        await writeText(action.path, '');
        return { id, ok: true, applied: true, message: `Created ${action.path}` };
      }

      case 'disable-mcp-server': {
        const backup = await trash(action.configPath, env);
        const ok = await setServerDisabled(action.configPath, action.name, true);
        return {
          id,
          ok,
          applied: ok,
          message: ok ? `Disabled "${action.name}".` : 'Server not found.',
          backup: [backup],
        };
      }

      case 'remove-mcp-server': {
        const backup = await trash(action.configPath, env);
        const ok = await removeServer(action.configPath, action.name);
        return {
          id,
          ok,
          applied: ok,
          message: ok ? `Removed "${action.name}".` : 'Server not found.',
          backup: [backup],
        };
      }

      case 'delete-duplicates': {
        const backups: string[] = [];
        for (const path of action.remove) {
          if (!(await pathExists(path))) continue;
          backups.push(await trash(path, env));
          await removePath(path);
        }
        return {
          id,
          ok: true,
          applied: backups.length > 0,
          message: `Removed ${backups.length} duplicate(s); kept ${action.keep}.`,
          backup: backups,
        };
      }

      default:
        return { id, ok: false, applied: false, message: 'Unknown remediation.' };
    }
  } catch (error) {
    return { id, ok: false, applied: false, message: (error as Error).message };
  }
}

/** Apply several remediations in sequence. */
export async function applyRemediations(
  remediations: readonly Remediation[],
  env?: PathEnv,
): Promise<RemediationResult[]> {
  const results: RemediationResult[] = [];
  for (const remediation of remediations) {
    // Only automatic remediations are applied; manual ones are reported as-is.
    results.push(
      remediation.automatic
        ? await applyRemediation(remediation, env)
        : { id: remediation.id, ok: true, applied: false, message: 'Manual fix — skipped.' },
    );
  }
  return results;
}
