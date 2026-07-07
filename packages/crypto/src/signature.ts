import {
  generateKeyPairSync,
  sign as nodeSign,
  verify as nodeVerify,
  createPublicKey,
  createPrivateKey,
} from 'node:crypto';

export interface KeyPairPem {
  readonly publicKey: string;
  readonly privateKey: string;
}

/** Generate an Ed25519 key pair, exported as PEM strings. */
export function generateKeyPair(): KeyPairPem {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return {
    publicKey: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  };
}

/** Sign data with an Ed25519 private key. Returns a base64 signature. */
export function signData(data: Buffer | string, privateKeyPem: string): string {
  const key = createPrivateKey(privateKeyPem);
  const signature = nodeSign(null, Buffer.isBuffer(data) ? data : Buffer.from(data), key);
  return signature.toString('base64');
}

/** Verify an Ed25519 signature (base64) against data and a public key. */
export function verifyData(
  data: Buffer | string,
  signatureBase64: string,
  publicKeyPem: string,
): boolean {
  try {
    const key = createPublicKey(publicKeyPem);
    return nodeVerify(
      null,
      Buffer.isBuffer(data) ? data : Buffer.from(data),
      key,
      Buffer.from(signatureBase64, 'base64'),
    );
  } catch {
    return false;
  }
}
