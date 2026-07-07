/**
 * A minimal, dependency-free structured logger. It writes human-readable lines
 * to the console and, optionally, retains structured entries in memory so a
 * backup or diagnostic run can persist its own audit log.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

export interface LoggerOptions {
  /** Minimum level that will be emitted. Defaults to `info`. */
  readonly level?: LogLevel;
  /** When true, entries are also retained in memory (see `drain`). */
  readonly capture?: boolean;
  /** Silence console output (useful for tests). */
  readonly silent?: boolean;
  /** Custom sink; receives a formatted line and the structured entry. */
  readonly sink?: (line: string, entry: LogEntry) => void;
}

export class Logger {
  private level: LogLevel;
  private readonly capture: boolean;
  private readonly silent: boolean;
  private readonly sink?: (line: string, entry: LogEntry) => void;
  private readonly entries: LogEntry[] = [];

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'info';
    this.capture = options.capture ?? false;
    this.silent = options.silent ?? false;
    if (options.sink) this.sink = options.sink;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  /** Return captured entries and clear the internal buffer. */
  drain(): LogEntry[] {
    const out = this.entries.slice();
    this.entries.length = 0;
    return out;
  }

  /** Return captured entries without clearing them. */
  snapshot(): readonly LogEntry[] {
    return this.entries.slice();
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[this.level]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context ? { context } : {}),
    };

    if (this.capture) this.entries.push(entry);

    const line = `${entry.timestamp} [${level.toUpperCase()}] ${message}`;
    if (this.sink) {
      this.sink(line, entry);
      return;
    }
    if (this.silent) return;

    const suffix = context ? ` ${JSON.stringify(context)}` : '';
    const full = line + suffix;
    if (level === 'error') console.error(full);
    else if (level === 'warn') console.warn(full);
    else console.log(full);
  }
}

/** Convenience factory. */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}

/** A shared no-op logger for library internals that should stay quiet. */
export const silentLogger = new Logger({ silent: true });
