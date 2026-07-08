# FAQ

### Does CEM modify or interfere with Claude Code?

No. CEM never writes to Claude Code binaries or Anthropic code, never intercepts network traffic,
never touches authentication, licensing or usage limits, and never calls private APIs. It reads
documented local files and writes `.cem` archives and (on restore) your own configuration files.

### Is any data sent to the cloud?

No. CEM has zero telemetry and performs no network calls of its own. A `.cem` file stays on your
disk until *you* move it. Optional sync targets (planned) are always explicit and user‑initiated.

### Will CEM delete my files?

Never automatically. Scanning is read‑only. Restore only writes files, and it skips existing files
unless you explicitly pass `--overwrite`.

### How accurate is the token count?

It's a fast **heuristic** for relative comparison (which files are heavy, which overlap). CEM does
not call any Anthropic tokenizer or API, so the numbers are estimates, not billing‑exact counts.

### What's inside a `.cem` file?

A ZIP with a readable `manifest.json`, a `checksums.json`, an `entries.json` restore table, a
`config.json`, your content organized by category, and a log. If encrypted, the content/checksums/
entries live in an AES‑256‑GCM `payload.enc` and only the manifest stays readable. See
[`cem-format.md`](./cem-format.md).

### I lost the password to an encrypted backup. Can you recover it?

No. Encryption uses AES‑256‑GCM with an Argon2id‑derived key and the password is never stored. By
design, a lost password means unrecoverable data.

### Can I back up just part of my environment?

Yes. Use a **profile** (`cem backup --profile <name>`) or restore selectively with
`--kinds skill,agent` (or a `select` predicate via the API).

### Does a backup from macOS restore on Windows/Linux?

Yes. Restore targets are stored relative to the home directory, not as absolute paths, so a backup
made under `/Users/alice` restores under `C:\Users\bob` or `/home/bob`.

### Which files does CEM consider "sensitive"?

`~/.claude.json`, `settings.json`/`settings.local.json`, `.mcp.json`, and the projects history —
because they can contain tokens or private data. The scanner flags them, the MCP manager masks
secret‑looking environment values, and you can encrypt any backup.

### How do I extend CEM?

Add an independent `@cem/*` package and wire it into the CLI/desktop via a thin adapter — no core
changes required. See [`plugins.md`](./plugins.md) and [`../CONTRIBUTING.md`](../CONTRIBUTING.md).

### Is CEM affiliated with Anthropic?

No. CEM is an independent, community open‑source project. "Claude" and "Claude Code" are trademarks
of Anthropic; CEM only interoperates with documented local files.
