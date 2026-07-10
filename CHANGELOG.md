# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-07-10

### Added

- **Temporal Token Usage analytics** (`@cem/usage`) — real token consumption over **24h / 3d / 7d /
  30d** windows, parsed read‑only from Claude Code's local session transcripts
  (`~/.claude/projects/**/*.jsonl`), de‑duplicated and grouped **per session and per project**.
  Consumption is split two ways: by **activity** (main session vs workflow agents/sidechains vs
  git/GitHub operations vs skill/agent launches) and by **token type** (context‑window reading vs
  cache building vs output). Active projects are correlated with the config files they load
  (`CLAUDE.md`, skills, agents) so heavy files are surfaced with their recurring cost.
- **Improvement proposals** — statistical outlier analysis (z‑scores across sessions) plus domain
  heuristics recommend: branching/restarting context‑heavy sessions, shrinking heavy config files,
  batching git pushes, and flag context churn and agent‑delegation patterns, with estimated savings.
- **Desktop “Token Usage” tab** — window selector, stacked timeline chart (hourly/daily buckets),
  per‑session and per‑project stacked category bars, and the proposals list. The **Dashboard**
  gains a “Token usage by project — last 7 days” bar chart.
- **CLI `cem usage`** — the same report in the terminal (`--window`, `--json`).

## [1.1.0] - 2026-07-10

### Added

- **Problem remediation ("Solve problems")** — diagnostics can now FIX what they find. A new
  remediation engine (`@cem/diagnostics`) proposes the best fix for each finding — remove a broken
  MCP server, de‑duplicate identical files, create a missing referenced file — and the user
  **accepts or ignores each fix individually**. Every destructive change is backed up to CEM's
  trash directory first, and every applied fix is audit‑logged. Available as `cem fix`
  (interactive; `--dry-run`, `-y`) and as the **Solve problems** button in the desktop Diagnostics
  view. Fixes only ever touch the user's own Claude Code files — never Claude Code itself, never
  arbitrary system commands.
- **Optional Git sync** — `@cem/sync` with a Git provider (init/status/commit/push/pull/clone),
  a `cem sync` CLI command and a desktop Sync view. Nothing is ever pushed automatically; CEM does
  no credential handling. Other providers (Drive/OneDrive/Dropbox/NAS) can plug into the same shape.
- **Auto‑update with rollback safety** — the desktop app can check, download and install updates
  (electron‑updater) with explicit consent and a **pre‑update `.cem` backup**. Settings expose the
  update controls and an opt‑in launch check. Only CEM updates itself; Claude Code is never touched.
- **MCP manager write actions** — export/import `mcp.json`, merge into a config file
  (non‑destructive), enable/disable and remove servers, from the CLI (`cem mcp …`) and the desktop
  MCP view. CEM only edits your own declarative config files and never runs an MCP server.
- **Skills & Agents managers** — front‑matter parsing surfaces skill metadata (description, author,
  version, dependencies, tokens) and agent metadata (model, tools, enabled state) in both the CLI
  (`cem skills`, `cem agents`) and dedicated desktop views.
- **History & audit log** — a local backup registry (`history.json`) that populates the Dashboard's
  "last backup", plus an append‑only operation audit log (`logs/audit.log`) and a `cem history`
  command.
- **UI polish** — a dedicated Plugins view, selective per‑file restore (checkboxes + select
  all/none, backed by a new `archivePaths` restore option), branded app icons (png/ico/icns) and a
  one‑command icon generator (`scripts/generate-icons.mjs`).

### Fixed

- Scanner no longer produces duplicate artifacts when `--home` is a relative path.

## [1.0.0] - 2026-07-07

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
  `profiles`, `tokens`, `mcp`.
- **Desktop app** — Electron + React UI with Dashboard, Scanner, Skills, Agents, Markdown, MCP,
  Profiles, Diagnostics, Token Analyzer, Backup, Restore and Settings; light/dark themes.
- **`.cem` format 1.0.0** — ZIP container with `manifest.json`, `checksums.json`, `entries.json`,
  `config.json`, category directories and logs; optional AES‑256‑GCM encrypted payload.
- Documentation, CI workflows, issue/PR templates and an example environment.

[Unreleased]: https://github.com/luizdione/CEM/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/luizdione/CEM/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/luizdione/CEM/releases/tag/v1.0.0
