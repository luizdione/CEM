import { describe, it, expect } from 'vitest';
import {
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  mapResult,
  tryCatch,
  CemError,
  ValidationError,
  toCemError,
  formatBytes,
  formatNumber,
  timeAgo,
  slugify,
  fileTimestamp,
  clamp,
} from './index.js';

describe('Result', () => {
  it('constructs ok and err values', () => {
    expect(isOk(ok(1))).toBe(true);
    expect(isErr(err('boom'))).toBe(true);
  });

  it('unwraps success and throws on error', () => {
    expect(unwrap(ok(42))).toBe(42);
    expect(() => unwrap(err(new Error('nope')))).toThrow('nope');
  });

  it('unwrapOr returns fallback on error', () => {
    expect(unwrapOr(ok(1), 9)).toBe(1);
    expect(unwrapOr(err('x'), 9)).toBe(9);
  });

  it('maps only success values', () => {
    expect(mapResult(ok(2), (n) => n * 2)).toEqual(ok(4));
    const e = err<string>('bad');
    expect(mapResult(e, (n: number) => n * 2)).toBe(e);
  });

  it('tryCatch captures thrown errors', async () => {
    const good = await tryCatch(() => 1);
    const bad = await tryCatch(() => {
      throw new Error('kaboom');
    });
    expect(good).toEqual(ok(1));
    expect(isErr(bad)).toBe(true);
  });
});

describe('errors', () => {
  it('carries a stable code and serializes', () => {
    const e = new ValidationError('bad input', { details: { field: 'name' } });
    expect(e).toBeInstanceOf(CemError);
    expect(e.code).toBe('CEM_VALIDATION');
    expect(e.toJSON()).toMatchObject({ code: 'CEM_VALIDATION', message: 'bad input' });
  });

  it('normalizes unknown values', () => {
    expect(toCemError('plain').message).toBe('plain');
    expect(toCemError(new Error('e')).code).toBe('CEM_UNKNOWN');
    const existing = new ValidationError('v');
    expect(toCemError(existing)).toBe(existing);
  });
});

describe('format', () => {
  it('formats bytes across units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024 * 5)).toBe('5.0 MB');
  });

  it('formats numbers with separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('computes relative time', () => {
    const now = new Date('2025-01-01T00:00:00Z');
    const twoHoursAgo = new Date('2024-12-31T22:00:00Z').toISOString();
    expect(timeAgo(twoHoursAgo, now)).toBe('2 hours ago');
    expect(timeAgo(undefined)).toBe('never');
  });

  it('clamps values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('id helpers', () => {
  it('slugifies text', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(slugify('Bioinformática & Python')).toBe('bioinformatica-python');
  });

  it('produces filesystem-safe timestamps', () => {
    const ts = fileTimestamp(new Date('2025-01-31T14:05:09'));
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/);
  });
});
