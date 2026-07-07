import pc from 'picocolors';
import { createInterface } from 'node:readline';
import { formatBytes, formatNumber } from '@cem/shared';

export const ui = {
  heading(text: string): void {
    console.log(`\n${pc.bold(pc.cyan(text))}`);
  },
  success(text: string): void {
    console.log(`${pc.green('✓')} ${text}`);
  },
  error(text: string): void {
    console.error(`${pc.red('✗')} ${text}`);
  },
  warn(text: string): void {
    console.log(`${pc.yellow('!')} ${text}`);
  },
  info(text: string): void {
    console.log(`${pc.blue('i')} ${text}`);
  },
  item(text: string): void {
    console.log(`  ${pc.dim('•')} ${text}`);
  },
  kv(label: string, value: string | number): void {
    console.log(`  ${pc.dim(label.padEnd(18))} ${value}`);
  },
  dim(text: string): string {
    return pc.dim(text);
  },
  bytes(n: number): string {
    return formatBytes(n);
  },
  num(n: number): string {
    return formatNumber(n);
  },
};

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/** Render a simple label→count table. */
export function printCounts(counts: Record<string, number>): void {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const width = Math.max(4, ...entries.map(([k]) => k.length));
  for (const [key, value] of entries) {
    console.log(`  ${pc.dim(key.padEnd(width))}  ${pc.bold(String(value))}`);
  }
}

/** Ask a yes/no question. Returns true for yes. Non-TTY defaults to `false`. */
export async function confirm(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await new Promise<string>((resolve) => {
      rl.question(`${question} ${pc.dim('[y/N]')} `, resolve);
    });
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

/**
 * Read a password. Precedence: explicit value → `CEM_PASSWORD` env → hidden
 * TTY prompt. Returns undefined when none is available (non-interactive).
 */
export async function resolvePassword(
  explicit: string | undefined,
  { prompt = false }: { prompt?: boolean } = {},
): Promise<string | undefined> {
  if (explicit) return explicit;
  if (process.env.CEM_PASSWORD) return process.env.CEM_PASSWORD;
  if (!prompt || !process.stdin.isTTY) return undefined;

  return new Promise<string>((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const stdout = process.stdout;
    const onData = (): void => {
      // Re-write the prompt line to mask characters already typed.
      stdout.write('[2K[200D' + pc.dim('Password: ') + '*'.repeat(0));
    };
    process.stdin.on('data', onData);
    rl.question(pc.dim('Password: '), (answer) => {
      process.stdin.off('data', onData);
      stdout.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

/** Format an error for display, preferring CEM error codes when present. */
export function formatError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return `[${String((error as { code: unknown }).code)}] ${String((error as { message: unknown }).message)}`;
  }
  return error instanceof Error ? error.message : String(error);
}
