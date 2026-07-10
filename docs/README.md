# CEM Documentation

| Document | Description |
| --- | --- |
| [Architecture](./architecture.md) | How the monorepo, packages and apps fit together |
| [API Reference](./api.md) | Public API of each `@cem/*` package |
| [`.cem` Format](./cem-format.md) | On‑disk specification of the `.cem` archive |
| [Scanner](./scanner.md) | How artifacts are discovered (read‑only) |
| [MCP Manager](./mcp.md) | Discover, inspect and edit MCP server configs |
| [Remediation](./remediation.md) | "Solve problems": propose fixes, accept/ignore each |
| [Token Usage](./usage.md) | Temporal consumption (24h/3d/7d/30d) per session/project + proposals |
| [Backup System](./backup-system.md) | How a backup is planned and written |
| [Profiles](./profiles.md) | Activation profiles and matching rules |
| [Plugins](./plugins.md) | Plugin detection and the extensibility model |
| [Restore Flow](./restore-flow.md) | Step‑by‑step restore pipeline |
| [Updates & Rollback](./updates.md) | In‑app auto‑update with pre‑update backup |
| [Synchronization](./sync.md) | Optional, explicit Git sync of backups |
| [Import Flow](./import-flow.md) | Migrating an environment to a new machine |
| [User Manual](./user-manual.md) | End‑user guide (desktop + CLI) |
| [FAQ](./faq.md) | Frequently asked questions |

> Compliance reminder: CEM only reads/writes documented local files and never modifies,
> reverse‑engineers or intercepts Claude Code or any Anthropic software.
