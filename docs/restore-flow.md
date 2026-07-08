# Restore Flow

Restoring is intentionally cautious: **verify first, then write**, and never overwrite by default.

## Steps

```
read manifest → (password?) → decode + decrypt → verify checksums →
compute targets (conflict detection) → preview → write selected files
```

1. **Read manifest** (`readManifest`) — no password needed. Shows version, host, counts and whether
   the archive is encrypted. Refuses archives whose major format version is unsupported.
2. **Decode** (`readCemArchive`) — for encrypted archives the payload is decrypted with your
   password (AES‑256‑GCM). A wrong password or tampered data fails here, before any disk writes.
3. **Verify** (`verifyArchive`) — recomputes SHA‑256 for every entry and compares to the manifest.
   Returns `{ ok, verified, mismatches, missing }`.
4. **Compute targets** (`computeRestoreTargets`) — resolves each entry to a destination on this
   machine and flags files that already exist (conflicts).
5. **Restore** (`restoreArchive`) — writes selected files. Existing files are **skipped** unless
   `overwrite` is set (they are reported as `conflicts`).

## Guarantees

- If integrity verification fails, `restoreFromFile` throws `IntegrityError` and writes nothing
  (override only with an explicit `force`).
- `dryRun` computes the full plan and conflicts without touching disk.
- Restore is **selective**: filter by `kinds` or a custom `select` predicate.

## Target resolution

| Entry base | Destination |
| --- | --- |
| `home` | `<home>/<relative>` (e.g. `~/.claude/skills/x/SKILL.md`) |
| `project` | `<projectBaseDir>/<projectSlug>/<relative>` |
| `absolute` | `<externalBaseDir>/<basename>` |

## CLI

```bash
cem verify backup.cem                 # integrity only
cem restore backup.cem --dry-run      # preview + conflicts
cem restore backup.cem --yes          # restore (skip existing)
cem restore backup.cem --overwrite -y # replace existing files
cem restore backup.cem --kinds skill,agent
cem restore backup.cem --home /new/home --project-dir ~/projects
```

## Desktop

The **Restore** view walks you through: choose file → (enter password) → *Verify & preview* →
review the plan (new vs. existing) → *Restore now*. The button is disabled if integrity fails.
