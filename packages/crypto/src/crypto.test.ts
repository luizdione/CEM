import { describe, it, expect } from 'vitest';
import {
  sha256,
  digestsEqual,
  deriveKey,
  generateSalt,
  encrypt,
  decrypt,
  splitEnvelope,
  generateKeyPair,
  signData,
  verifyData,
} from './index.js';

describe('hash', () => {
  it('computes a stable SHA-256', () => {
    expect(sha256('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('compares digests in constant time', () => {
    expect(digestsEqual(sha256('a'), sha256('a'))).toBe(true);
    expect(digestsEqual(sha256('a'), sha256('b'))).toBe(false);
  });
});

describe('kdf', () => {
  it('derives a deterministic 32-byte key for a salt', async () => {
    const salt = generateSalt();
    const k1 = await deriveKey('correct horse battery staple', salt);
    const k2 = await deriveKey('correct horse battery staple', salt);
    expect(k1.length).toBe(32);
    expect(k1.equals(k2)).toBe(true);
  });

  it('produces different keys for different salts', async () => {
    const a = await deriveKey('pw', generateSalt());
    const b = await deriveKey('pw', generateSalt());
    expect(a.equals(b)).toBe(false);
  });
});

describe('cipher', () => {
  it('round-trips data through AES-256-GCM', async () => {
    const plaintext = Buffer.from('sensitive backup payload — MCP api keys etc.', 'utf8');
    const envelope = await encrypt(plaintext, 'hunter2');
    const { header, ciphertext } = splitEnvelope(envelope);

    expect(header.algorithm).toBe('AES-256-GCM');
    expect(ciphertext.equals(plaintext)).toBe(false);

    const decrypted = await decrypt(header, ciphertext, 'hunter2');
    expect(decrypted.equals(plaintext)).toBe(true);
  });

  it('fails to decrypt with the wrong password', async () => {
    const envelope = await encrypt(Buffer.from('secret'), 'right');
    const { header, ciphertext } = splitEnvelope(envelope);
    await expect(decrypt(header, ciphertext, 'wrong')).rejects.toThrow(/wrong password/i);
  });

  it('detects tampering via the GCM auth tag', async () => {
    const envelope = await encrypt(Buffer.from('secret'), 'pw');
    const { header, ciphertext } = splitEnvelope(envelope);
    const tampered = Buffer.from(ciphertext);
    if (tampered.length > 0) tampered[0] = (tampered[0]! ^ 0xff) & 0xff;
    await expect(decrypt(header, tampered, 'pw')).rejects.toThrow();
  });
});

describe('signature', () => {
  it('signs and verifies with Ed25519', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const data = Buffer.from('manifest bytes');
    const sig = signData(data, privateKey);
    expect(verifyData(data, sig, publicKey)).toBe(true);
    expect(verifyData(Buffer.from('tampered'), sig, publicKey)).toBe(false);
  });
});
