export interface Frontmatter {
  readonly data: Record<string, unknown>;
  readonly body: string;
}

/**
 * Parse a leading YAML front-matter block delimited by `---`. This is a small,
 * dependency-free parser that handles the subset used by Claude Code skills and
 * agents: scalar values, inline lists (`[a, b]`) and block lists (`- item`).
 * An optional leading UTF-8 byte-order mark is tolerated.
 */
export function parseFrontmatter(content: string): Frontmatter {
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(content);
  if (!match) return { data: {}, body: content };

  const block = match[1] ?? '';
  const body = content.slice(match[0].length);
  const data: Record<string, unknown> = {};

  const lines = block.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    i += 1;
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const key = kv[1]!;
    const rawValue = (kv[2] ?? '').trim();

    if (rawValue === '') {
      // Possibly a block list on following indented lines.
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i] ?? '')) {
        items.push(stripQuotes((lines[i] ?? '').replace(/^\s*-\s+/, '').trim()));
        i += 1;
      }
      data[key] = items;
    } else if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      data[key] = rawValue
        .slice(1, -1)
        .split(',')
        .map((s) => stripQuotes(s.trim()))
        .filter(Boolean);
    } else {
      data[key] = coerceScalar(stripQuotes(rawValue));
    }
  }

  return { data, body };
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function coerceScalar(value: string): string | number | boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

/** Read a field as a string (numbers/booleans are stringified, e.g. `1.2`). */
export function fmString(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

/** Read a string-array field from parsed front-matter data. */
export function fmList(data: Record<string, unknown>, key: string): string[] {
  const value = data[key];
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}
