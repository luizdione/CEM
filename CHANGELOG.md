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
  `profiles`, `tokens`, `mcp`.
- **Desktop app** — Electron + React UI with Dashboard, Scanner, Skills, Agents, Markdown, MCP,
  Profiles, Diagnostics, Token Analyzer, Backup, Restore and Settings; light/dark themes.
- **`.cem` format 1.0.0** — ZIP container with `manifest.json`, `checksums.json`, `entries.json`,
  `config.json`, category directories and logs; optional AES‑256‑GCM encrypted payload.
- Documentation, CI workflows, issue/PR templates and an example environment.

[Unreleased]: https://github.com/luizdione/CEM/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/luizdione/CEM/releases/tag/v1.0.0
