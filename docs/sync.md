# Synchronization (optional, never automatic)

CEM can optionally synchronize your **backups directory** with a Git remote (GitHub, a self‑hosted
Git server, a NAS bare repo, …). The design has one hard rule from the spec:

> **CEM never sends data automatically.** Nothing leaves your machine until you explicitly run
> `cem sync push` (CLI) or click **Commit & push** (desktop).

Other providers (Google Drive, OneDrive, Dropbox, NAS shares) can be added behind the same
`SyncProvider` shape — Git is the first, fully‑implemented provider.

## Security note

A `.cem` backup can contain secrets (e.g. MCP environment values). **Encrypt sensitive backups**
before syncing them to a remote. CEM performs **no credential handling** — pushing and pulling use
your existing git configuration and SSH/HTTPS credentials.

## CLI

```bash
# Point your backups directory at a remote and push (explicit, with confirmation)
cem sync init --remote git@github.com:you/cem-backups.git
cem sync push -m "backup 2025-01-31"

# Inspect and pull
cem sync status
cem sync pull

# Recover backups onto a new machine
cem sync clone git@github.com:you/cem-backups.git ~/CEM\ Backups
```

`cem sync push` warns that pushing uploads your backups and asks for confirmation (skip with `-y`).
Use `--no-push` to commit locally without uploading.

## Desktop

The **Sync** view shows the repository state (branch, remote, clean/dirty, ahead/behind, last
commit) and offers **Initialize / Set remote**, **Commit only**, **Commit & push** (with an upload
confirmation) and **Pull**.

## API

```ts
import { gitProvider } from '@cem/sync';

await gitProvider.init(dir, { remote });
await gitProvider.commitAndPush(dir, 'message', { push: true });
const status = await gitProvider.status(dir);
await gitProvider.pull(dir);
await gitProvider.clone(remote, dir);
```

Every method returns a `SyncResult` (`{ ok, action, message, committed?, pushed? }`) or, for
`status`, a `SyncStatus`.

## Compliance

Sync only ever moves **your own `.cem` files** to a remote **you** configure. It never touches
Claude Code or any Anthropic software.
