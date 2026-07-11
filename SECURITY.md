# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in CEM, please report it **privately**:

- Email **luiz.dione.melo@gmail.com** with the subject `CEM SECURITY`, or
- Use GitHub's [private vulnerability reporting](https://github.com/luizdione/CEM/security/advisories/new).

Please include a description, reproduction steps, affected version and potential impact. We aim to
acknowledge reports within 72 hours and to provide a remediation timeline after triage.

Do **not** open a public issue for security problems.

## Scope and threat model

CEM is a local‑first tool. Its most security‑sensitive responsibilities are:

- **Encryption of backups** — AES‑256‑GCM with an Argon2id‑derived key.
- **Integrity** — SHA‑256 checksums for every archived file, verified before restore.
- **Secret handling** — MCP environment values and other sensitive fields are only stored inside
  the (optionally encrypted) archive payload; the manifest never contains passwords or keys.

### What CEM deliberately does NOT do

To stay within Anthropic's Terms of Use, CEM does not and will not:

- modify or patch Claude Code binaries or Anthropic code;
- intercept, proxy or inspect network traffic;
- reverse‑engineer Anthropic products;
- manipulate authentication, licensing or usage limits;
- call private/undocumented APIs.

## Cryptography notes

- **Key derivation:** Argon2id (default 64 MiB, 3 iterations, parallelism 1). Parameters are stored
  in the archive header so future defaults can change without breaking old archives.
- **Encryption:** AES‑256‑GCM. A random 96‑bit IV and 128‑bit auth tag are generated per archive.
  Tampering is detected by GCM authentication before any bytes are written to disk.
- **Passwords** are never written to disk and never included in the manifest. If you lose the
  password to an encrypted `.cem`, the data is unrecoverable by design.
- **Signatures:** Ed25519 primitives are provided for optionally signing archives/manifests.

## Supported versions

Until 1.0.0 is tagged, only the `main` branch receives security fixes. After 1.0.0, the latest
minor release line is supported.
