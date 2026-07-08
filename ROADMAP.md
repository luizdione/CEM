# Roadmap

CEM follows [Semantic Versioning](https://semver.org). This roadmap is indicative and community
input is welcome — open a discussion or issue to propose changes.

## ✅ 1.0.0 — Foundation (current)

- Monorepo, core packages, crypto, scanner, markdown, MCP, profiles, diagnostics.
- `.cem` backup format with checksums and AES‑256‑GCM encryption.
- CLI with the full command set.
- Desktop app (Electron + React) with all primary views.
- Documentation, CI, tests.

## 🔜 1.1 — Quality of life

- Incremental / diff‑based backups (store only what changed since the last `.cem`).
- Backup registry and history view in the desktop app.
- Drag‑and‑drop `.cem` import.
- Richer profile editor (visual selection rules, live preview of matched artifacts).
- More granular restore (per‑file selection tree).

## 🔭 1.2 — Sync (opt‑in, never automatic)

- Optional sync targets: Git/GitHub, Google Drive, OneDrive, Dropbox, NAS, local server.
- Explicit, user‑initiated push/pull only — no background uploads.
- Signed archives (Ed25519) with verify‑on‑import.

## 🧩 1.3 — Plugins & extensibility

- Formal plugin manager (list, inspect, export/import plugin bundles).
- Public extension API so third‑party modules can add scanners, exporters and views.
- Community profile & skill templates gallery.

## 🧪 Ongoing

- Broader test coverage (UI, performance, migration matrices).
- Auto‑update with rollback and pre‑update backup.
- Localization (starting with English and Portuguese).
- Accessibility polish.

## ❌ Explicit non‑goals

CEM will **never** modify Claude Code binaries, intercept traffic, reverse‑engineer Anthropic
products, or bypass authentication/licensing/usage limits. Any feature request in that direction is
out of scope.
