# Backup System

The backup engine (`@cem/backup`) turns a set of scanned artifacts into a `.cem` archive.

## Pipeline

```
scan → plan → read + hash → assemble payload → (encrypt?) → write .cem
```

1. **Plan** (`planArtifacts`) — each artifact gets:
   - an `archivePath` (category‑organized, guaranteed unique);
   - a portable `restore` target (`home` / `project` / `absolute` + relative path).
2. **Read + hash** — each source file is read and SHA‑256 hashed. Unreadable files are skipped and
   reported in `result.skipped`.
3. **Assemble payload** — `checksums.json`, `entries.json`, `config.json`, the content files, and a
   `logs/backup.log` are collected.
4. **Encrypt (optional)** — if a password is supplied, the payload is zipped and encrypted with
   AES‑256‑GCM using an Argon2id‑derived key; the ciphertext becomes `payload.enc`.
5. **Write** — the outer ZIP (`manifest.json` + payload) is written to `<outDir>/<fileName>.cem`.

## Usage

```ts
import { backupEnvironment } from '@cem/backup';

const result = await backupEnvironment({
  home,                       // machine to back up (default: current home)
  outDir,                     // default: ~/CEM Backups
  fileName,                   // default: cem-backup-<timestamp>.cem
  password,                   // omit for an unencrypted archive
  notes,
  includeProjectHistory,      // default false
  profilesIncluded,           // names recorded in the manifest
  filter,                     // (artifact) => boolean, e.g. from a profile
});
// result: { path, bytes, fileCount, manifest, encrypted, skipped }
```

Lower‑level `createBackup(artifacts, ctx, options)` is available when you already have a curated
artifact list.

## What is included

skills · agents · commands · MCP config files · markdown/memory · settings/config · plugins ·
profiles (when selected) · project files (opt‑in) · metadata · checksums · logs.

## What is **not** included

- Claude Code binaries or any Anthropic code (CEM never touches them).
- Runtime state directories (`statsig`, `todos`, `ide`, shell snapshots).
- Anything outside documented, user‑owned locations.

## CLI

```bash
cem backup                          # full, unencrypted, to ~/CEM Backups
cem backup --encrypt                # prompts / uses CEM_PASSWORD
cem backup --profile "My Python"    # only artifacts matching a profile
cem backup --out ./backups --name env.cem --notes "before reinstall"
cem export ./portable.cem           # portable export to a specific path
```

## Registry & audit log

Each successful backup is recorded in CEM's local **registry** (`history.json` in CEM's data
directory) and updates `config.lastBackupAt` (shown on the Dashboard). Backups, restores and
verifications are also appended to an **audit log** (`logs/audit.log`, JSON Lines). Inspect them with:

```bash
cem history           # list recorded backups
cem history log       # recent operations
```

The registry only tracks metadata (path, size, counts, timestamps) — removing an entry never deletes
the `.cem` file.
