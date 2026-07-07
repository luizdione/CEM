import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { CryptoError } from '@cem/shared';
import { deriveKey, generateSalt, DEFAULT_KDF_PARAMS, type KdfParams } from './kdf.js';

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 12; // 96-bit nonce, recommended for GCM

export interface EncryptedEnvelope {
  readonly algorithm: 'AES-256-GCM';
  readonly kdf: 'argon2id';
  /** Base64 KDF salt. */
  readonly salt: string;
  /** Base64 AES-GCM IV. */
  readonly iv: string;
  /** Base64 GCM authentication tag. */
  readonly authTag: string;
  readonly kdfParams: KdfParams;
  /** Raw ciphertext bytes. */
  readonly ciphertext: Buffer;
}

/** Metadata portion of an envelope (everything except the ciphertext). */
export type EncryptionHeader = Omit<EncryptedEnvelope, 'ciphertext'>;

/**
 * Encrypt a buffer with AES-256-GCM using an Argon2id-derived key. Returns an
 * envelope whose header can be persisted alongside the ciphertext.
 */
export async function encrypt(
  plaintext: Buffer,
  password: string,
  kdfParams: KdfParams = DEFAULT_KDF_PARAMS,
): Promise<EncryptedEnvelope> {
  if (!password) throw new CryptoError('A password is required to encrypt data.');

  const salt = generateSalt();
  const key = await deriveKey(password, salt, kdfParams);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: 'AES-256-GCM',
    kdf: 'argon2id',
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    kdfParams,
    ciphertext,
  };
}

/**
 * Decrypt an envelope produced by {@link encrypt}. Throws {@link CryptoError}
 * when the password is wrong or the data has been tampered with (GCM auth fail).
 */
export async function decrypt(
  header: EncryptionHeader,
  ciphertext: Buffer,
  password: string,
): Promise<Buffer> {
  if (!password) throw new CryptoError('A password is required to decrypt data.');

  const salt = Buffer.from(header.salt, 'base64');
  const iv = Buffer.from(header.iv, 'base64');
  const authTag = Buffer.from(header.authTag, 'base64');
  const key = await deriveKey(password, salt, header.kdfParams);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (cause) {
    throw new CryptoError('Decryption failed: wrong password or corrupted data.', { cause });
  }
}

/** Split an envelope into its serializable header and raw ciphertext. */
export function splitEnvelope(envelope: EncryptedEnvelope): {
  header: EncryptionHeader;
  ciphertext: Buffer;
} {
  const { ciphertext, ...header } = envelope;
  return { header, ciphertext };
}
