# Updates & Rollback

The desktop app can update itself using [electron‑updater](https://www.electron.build/auto-update),
with two safety guarantees:

1. **Consent** — updates never install silently. CEM checks and downloads only when you ask (or, if
   you opt in, checks on launch), and it installs only when you click **Restart & install**.
2. **Rollback safety** — before downloading an update, CEM creates a **pre‑update `.cem` backup** of
   your environment (unless you disable it). If a new version misbehaves, you can reinstall the
   previous version and import that backup.

## Flow

```
Check  →  Available  →  (pre-update backup)  →  Download  →  Downloaded  →  Restart & install
```

In **Settings → Updates**:

- **Check for updates** — queries the GitHub Releases feed.
- **Download <version>** — makes the pre‑update backup, then downloads.
- **Restart & install** — quits and applies the update.
- **Check automatically on launch** — opt‑in background check (never auto‑installs).
- **Create a backup before applying an update** — on by default.

In development (unpackaged), the updater is inert and reports "Updates are only available in the
installed app."

## How rollback works

CEM does not silently replace binaries or roll them back for you (that would be fragile across
platforms). Instead it gives you a clean recovery path:

1. The pre‑update backup path is shown after download and recorded in the audit log.
2. If needed, download the previous release from GitHub and reinstall it.
3. Run **Restore** on the pre‑update `.cem` to bring your environment back to exactly where it was.

## Publishing the update feed

`electron-builder.yml` declares a GitHub `publish` provider. The
[`release.yml`](../.github/workflows/release.yml) workflow builds installers **and** the
`latest*.yml` / `*.blockmap` metadata on tagged releases and attaches them to the GitHub Release,
which is what the in‑app updater reads.

> Compliance: auto‑update only updates **CEM itself**. It never touches Claude Code or any Anthropic
> software.
