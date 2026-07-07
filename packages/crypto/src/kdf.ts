import { randomBytes } from 'node:crypto';
import { argon2id } from 'hash-wasm';
import { CryptoError } from '@cem/shared';

export interface KdfParams {
  /** Memory cost in kibibytes. */
  readonly memoryCost: number;
  /** Number of iterations (time cost). */
  readonly timeCost: number;
  /** Degree of parallelism. */
  readonly parallelism: number;
}

/**
 * Default Argon2id parameters. Tuned for interactive desktop use — strong, but
 * fast enough that unlocking a backup does not take many seconds.
 */
export const DEFAULT_KDF_PARAMS: KdfParams = {
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 1,
};

/** Length in bytes of a derived AES-256 key. */
export const KEY_LENGTH = 32;

/** Minimum salt length accepted by Argon2. */
export const SALT_LENGTH = 16;

/** Generate a cryptographically secure random salt. */
export function generateSalt(length: number = SALT_LENGTH): Buffer {
  return randomBytes(length);
}

/**
 * Derive a 32-byte key from a password using Argon2id (pure-WASM, no native
 * modules). Throws {@link CryptoError} on empty input.
 */
export async function deriveKey(
  password: string,
  salt: Buffer,
  params: KdfParams = DEFAULT_KDF_PARAMS,
): Promise<Buffer> {
  if (!password) throw new CryptoError('A password is required to derive a key.');
  if (salt.length < 8) throw new CryptoError('Salt must be at least 8 bytes.');

  const hash = await argon2id({
    password,
    salt,
    parallelism: params.parallelism,
    iterations: params.timeCost,
    memorySize: params.memoryCost,
    hashLength: KEY_LENGTH,
    outputType: 'binary',
  });
  return Buffer.from(hash);
}
