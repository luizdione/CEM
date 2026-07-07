/**
 * Structured error hierarchy for CEM. Every error carries a stable, machine
 * readable `code` so the CLI and desktop app can present consistent messages.
 */

export type CemErrorCode =
  | 'CEM_UNKNOWN'
  | 'CEM_VALIDATION'
  | 'CEM_NOT_FOUND'
  | 'CEM_INTEGRITY'
  | 'CEM_CRYPTO'
  | 'CEM_BACKUP'
  | 'CEM_RESTORE'
  | 'CEM_SCANNER'
  | 'CEM_CONFIG'
  | 'CEM_IO'
  | 'CEM_UNSUPPORTED_VERSION';

export interface CemErrorOptions {
  readonly cause?: unknown;
  readonly details?: Record<string, unknown>;
}

export class CemError extends Error {
  readonly code: CemErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: CemErrorCode, message: string, options: CemErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.code = code;
    if (options.details) this.details = options.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class ValidationError extends CemError {
  constructor(message: string, options?: CemErrorOptions) {
    super('CEM_VALIDATION', message, options);
  }
}

export class NotFoundError extends CemError {
  constructor(message: string, options?: CemErrorOptions) {
    super('CEM_NOT_FOUND', message, options);
  }
}

export class IntegrityError extends CemError {
  constructor(message: string, options?: CemErrorOptions) {
    super('CEM_INTEGRITY', message, options);
  }
}

export class CryptoError extends CemError {
  constructor(message: string, options?: CemErrorOptions) {
    super('CEM_CRYPTO', message, options);
  }
}

export class BackupError extends CemError {
  constructor(message: string, options?: CemErrorOptions) {
    super('CEM_BACKUP', message, options);
  }
}

export class RestoreError extends CemError {
  constructor(message: string, options?: CemErrorOptions) {
    super('CEM_RESTORE', message, options);
  }
}

export class ScannerError extends CemError {
  constructor(message: string, options?: CemErrorOptions) {
    super('CEM_SCANNER', message, options);
  }
}

export class UnsupportedVersionError extends CemError {
  constructor(message: string, options?: CemErrorOptions) {
    super('CEM_UNSUPPORTED_VERSION', message, options);
  }
}

/** Normalize an unknown thrown value into a CemError. */
export function toCemError(value: unknown): CemError {
  if (value instanceof CemError) return value;
  if (value instanceof Error) {
    return new CemError('CEM_UNKNOWN', value.message, { cause: value });
  }
  return new CemError('CEM_UNKNOWN', String(value));
}
