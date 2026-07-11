# Scanner

The scanner discovers Claude Code artifacts on the local machine. **It is strictly read‑only** — it
never creates, moves, deletes or modifies anything. Nothing is ever removed automatically.

## What it looks for

### User scope (`~`)

| Location | Kind |
| --- | --- |
| `~/.claude.json` | config (sensitive) |
| `~/.claude/settings.json`, `settings.local.json` | setting (sensitive) |
| `~/.claude/CLAUDE.md` | memory |
| `~/.claude/commands/**` | command |
| `~/.claude/agents/**` | agent |
| `~/.claude/skills/**` | skill |
| `~/.claude/plugins/**` | plugin |
| `~/.claude/keybindings.json` | config |
| `~/.claude/projects/**` | project (opt‑in, sensitive) |

Plus a **deep sweep** of `~/.claude` that picks up any other related markdown/JSON/YAML/TOML file
(e.g. `coding.md`, `research.md`, `bioinformatics.md`), skipping runtime‑state directories
(`statsig`, `todos`, `ide`, `shell-snapshots`, `logs`, and `projects` unless opted in).

### Project scope

Auto‑discovered from the `projects` map in `~/.claude.json`, plus any roots you pass explicitly:

| Location | Kind |
| --- | --- |
| `<project>/CLAUDE.md`, `CLAUDE.local.md` | memory |
| `<project>/.mcp.json` | mcp (sensitive) |
| `<project>/.claude/settings.json`, `settings.local.json` | setting |
| `<project>/.claude/commands|agents|skills/**` | command / agent / skill |

### Desktop app config

`claude_desktop_config.json` (per‑OS location) is read for MCP server definitions.

## Output

`scanEnvironment(options)` returns a `ScanResult`:

```ts
{
  scannedAt: string;
  roots: string[];
  host: HostInfo;
  artifacts: ScannedArtifact[];   // id, kind, scope, path, name, size, mtime, tokens?, sha256?, sensitive?
  warnings: string[];
}
```

## Options

```ts
scanEnvironment({
  home,                    // default: os.homedir()
  projectRoots,            // extra roots to scan
  discoverProjects,        // default true — read ~/.claude.json
  includeProjectHistory,   // default false — include ~/.claude/projects
  deepScan,                // default true — sweep ~/.claude
  computeTokens,           // default true
  computeHashes,           // default false (backup computes its own hashes)
});
```

## Safety

- Files larger than 2 MB are not read for token estimation.
- Binary files are skipped for text analysis.
- Unreadable files produce a warning, never a crash.
- Sensitive locations are flagged so the UI/CLI can warn before export.
