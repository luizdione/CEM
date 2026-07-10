import { homedir } from 'node:os';
import { join, basename } from 'node:path';
import { pathExists, readText, walk } from '@cem/shared';
import type { UsageCategory, UsageEntry } from './types.js';

/** Largest transcript file we will parse (guards against pathological files). */
const MAX_TRANSCRIPT_BYTES = 200 * 1024 * 1024;

const GIT_RE = /(^|[\s;&|(])(git|gh)\s/;

interface RawLine {
  type?: string;
  isSidechain?: boolean;
  cwd?: string;
  sessionId?: string;
  requestId?: string;
  uuid?: string;
  timestamp?: string;
  message?: {
    id?: string;
    model?: string;
    content?: unknown;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
}

function classify(raw: RawLine): UsageCategory {
  if (raw.isSidechain) return 'agents';
  const content = raw.message?.content;
  if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block !== 'object' || block === null) continue;
      const b = block as { type?: string; name?: string; input?: { command?: unknown } };
      if (b.type !== 'tool_use') continue;
      if (b.name === 'Skill' || b.name === 'Task' || b.name === 'Agent') return 'skills';
      if (b.name === 'Bash' && typeof b.input?.command === 'string' && GIT_RE.test(b.input.command)) {
        return 'git';
      }
    }
  }
  return 'main';
}

/**
 * Parse Claude Code's local session transcripts (`~/.claude/projects/**\/*.jsonl`)
 * into usage entries. Strictly READ-ONLY over the user's own files; malformed
 * lines and unreadable files are skipped. Streaming rewrites of the same
 * assistant message are de-duplicated via message id + request id.
 */
export async function parseUsage(options: { home?: string } = {}): Promise<UsageEntry[]> {
  const home = options.home ?? homedir();
  const root = join(home, '.claude', 'projects');
  if (!(await pathExists(root))) return [];

  const files = (await walk(root, { ignoreDirs: [] })).filter(
    (f) => f.path.endsWith('.jsonl') && f.size <= MAX_TRANSCRIPT_BYTES,
  );

  const entries: UsageEntry[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    let raw: string;
    try {
      raw = await readText(file.path);
    } catch {
      continue;
    }
    const dirProject = basename(join(file.path, '..'));
    const fileSession = basename(file.path, '.jsonl');

    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      let parsed: RawLine;
      try {
        parsed = JSON.parse(line) as RawLine;
      } catch {
        continue;
      }
      const usage = parsed.message?.usage;
      if (parsed.type !== 'assistant' || !usage || !parsed.timestamp) continue;

      const ts = Date.parse(parsed.timestamp);
      if (Number.isNaN(ts)) continue;

      const dedupe =
        parsed.message?.id && parsed.requestId
          ? `${parsed.message.id}:${parsed.requestId}`
          : (parsed.uuid ?? `${file.path}:${entries.length}`);
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);

      entries.push({
        timestamp: ts,
        sessionId: parsed.sessionId ?? fileSession,
        project: parsed.cwd ?? dirProject,
        category: classify(parsed),
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
        cacheReadTokens: usage.cache_read_input_tokens ?? 0,
        ...(parsed.message?.model ? { model: parsed.message.model } : {}),
      });
    }
  }

  return entries.sort((a, b) => a.timestamp - b.timestamp);
}
