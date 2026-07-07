import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

/** Compute the SHA-256 of a buffer or string, returned as lowercase hex. */
export function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex');
}

/** Stream a file through SHA-256 without loading it fully into memory. */
export function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/** Constant-time comparison of two hex digests. */
export function digestsEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
