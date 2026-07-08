# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-01-31

### Added

- **Monorepo** with pnpm workspaces and TypeScript (ESM).
- **`@cem/shared`** — Result type, error hierarchy, logger, filesystem and formatting helpers.
- **`@cem/core`** — domain model, Claude Code location catalog, heuristic token estimator,
  `.cem` manifest types and application config.
- **`@cem/crypto`** — AES‑256‑GCM, Argon2id key derivation (pure‑WASM), SHA‑256 checksums and
  Ed25519 signatures.
- **`@cem/scanner`** — read‑only discovery of Claude Code artifacts with a deep sweep of `~/.claude`.
- **`@cem/markdown`** — token/line statistics, reference extraction and content‑overlap detection.
- **`@cem/mcp`** — MCP server discovery, normalization and secret redaction.
- **`@cem/profiles`** — profile CRUD, matching and example templates.
- **`@cem/diagnostics`** — health checks and token rollups.
- **`@cem/backup`** — `.cem` archive planner and writer with checksums and optional encryption.
- **`@cem/restore`** — read, verify and selectively restore `.cem` archives.
- **CLI (`cem`)** — `scan`, `doctor`, `backup`, `export`, `restore`, `import`, `verify`,
  `profiles`, `tokens`, `mcp`, `history`.
- **History & audit log** — a local backup registry (`history.json`) that populates the Dashboard's
  "last backup", plus an append‑only operation audit log (`logs/audit.log`).
- **Skills & Agents managers** — front‑matter parsing surfaces skill metadata (description, author,
  version, dependencies, tokens) and agent metadata (model, tools, enabled state) in both the CLI
  (`cem skills`, `cem agents`) and dedicated desktop views.
- **MCP manager write actions** — export/import `mcp.json`, merge into a config file
  (non‑destructive), enable/disable and remove servers, from the CLI (`cem mcp …`) and the desktop
  MCP view. CEM only edits your own declarative config files and never runs an MCP server.
- **Auto‑update with rollback safety** — the desktop app can check, download and install updates
  (electron‑updater) with explicit consent and a **pre‑update `.cem` backup**. Settings expose the
  update controls and an opt‑in launch check. Only CEM updates itself; Claude Code is never touched.
- **Desktop app** — Electron + React UI with Dashboard, Scanner, Skills, Agents, Markdown, MCP,
  Profiles, Diagnostics, Token Analyzer, Backup, Restore and Settings; light/dark themes.
- **`.cem` format 1.0.0** — ZIP container with `manifest.json`, `checksums.json`, `entries.json`,
  `config.json`, category directories and logs; optional AES‑256‑GCM encrypted payload.
- Documentation, CI workflows, issue/PR templates and an example environment.

[Unreleased]: https://github.com/luizdione/CEM/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/luizdione/CEM/releases/tag/v1.0.0
