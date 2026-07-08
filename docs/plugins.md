# Plugins

CEM treats **plugins** in two distinct senses. Don't confuse them.

## 1. Claude Code plugins (data CEM backs up)

Claude Code may store plugins under `~/.claude/plugins/`. CEM's scanner discovers these files as
`plugin`‑kind artifacts and includes them in backups (`plugins/` category in the `.cem` archive).
CEM only **reads and restores** these files — it never installs, executes, or modifies Claude Code
plugins.

```bash
cem scan            # plugin-kind artifacts appear in the "By category" summary
cem backup          # ~/.claude/plugins/** is captured
```

## 2. CEM extension modules (how CEM itself grows)

CEM is a modular monorepo. New capabilities are added as independent `@cem/*` packages that plug
into the CLI and desktop through thin adapters — **without modifying the core**. This is the
extensibility model described in [`architecture.md`](./architecture.md).

A CEM module typically provides one of:

| Extension point | Example |
| --- | --- |
| Scanner contributor | discover a new artifact kind |
| Exporter/importer | a new component export (e.g. MCP → `mcp.json`) |
| Diagnostic check | a new rule in `runDiagnostics` |
| Desktop view | a new sidebar panel over an existing package |

### Adding a module

1. Create `packages/<name>` mirroring an existing package's structure.
2. Depend only on `@cem/shared` / `@cem/core` (and other packages as needed) — never on the UI.
3. Export a clean API from `src/index.ts` and add tests.
4. Wire it into `apps/cli` and/or `apps/desktop` via a small adapter.

> A formal, versioned public plugin API for third parties is planned — see [`../ROADMAP.md`](../ROADMAP.md).
