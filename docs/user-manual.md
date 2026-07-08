# User Manual

This manual covers day‑to‑day use of CEM via the desktop app and the CLI. CEM is **local‑first and
read‑only** until you explicitly create a backup or run a restore. Nothing is ever deleted
automatically.

## Installing

- **Desktop:** download the installer for your OS from the Releases page and run it. On first launch
  CEM scans your environment (read‑only) and shows the Dashboard.
- **CLI:** `pnpm build:cli` then `npm i -g ./apps/cli`, or run `node apps/cli/dist/index.js`.

## The desktop app

### Sidebar

| Section | View | Purpose |
| --- | --- | --- |
| Overview | Dashboard | State, integrity, counts, footprint, alerts |
| Overview | Scanner | Every discovered artifact, searchable |
| Overview | Diagnostics | Findings (orphans, broken MCP, duplicates, bloat) |
| Overview | Token Analyzer | Heaviest docs, overlaps, recommendations |
| Managers | MCP Servers | MCP definitions (secrets masked) |
| Managers | Skills / Agents / Markdown | Category‑focused browsing |
| Managers | Profiles | Create/apply activation profiles |
| Migration | Backup | Create a `.cem` |
| Migration | Restore | Verify & restore a `.cem` |
| System | Settings | Theme, backup defaults, privacy |

### Creating a backup (desktop)

1. Go to **Backup**.
2. (Optional) choose an output folder and add a note.
3. Tick **Encrypt with AES‑256‑GCM** and set a password if the environment has secrets.
4. Click **Create backup**. The result shows the file path, size and file count.

### Restoring (desktop)

1. Go to **Restore** and **Choose file**.
2. Review the manifest (source OS, date, encrypted?).
3. Enter the password if needed, click **Verify & preview**.
4. Review the plan (new vs. existing files), optionally tick **Overwrite**.
5. Click **Restore now**. Blocked automatically if integrity fails.

## The CLI

```
cem scan        Discover artifacts (read-only)
cem doctor      Diagnose the environment
cem skills      List skills with metadata (description, version, deps, tokens)
cem agents      List agents with metadata (model, tools, enabled)
cem tokens      Analyze token usage / waste
cem mcp list    List MCP servers (secrets masked)
cem profiles    Manage profiles (list|templates|create|delete)
cem backup      Create a .cem backup
cem export      Portable export to a path (alias of backup)
cem verify      Verify a .cem's integrity
cem restore     Restore a .cem
cem import      Restore a .cem (alias)
cem history     Backup registry & audit log (list|remove|clear|log)
```

Common flags: `--home <dir>`, `--json`, `--password <pw>` (or `CEM_PASSWORD` env),
`--dry-run`, `--overwrite`, `--kinds skill,agent`, `--profile <name>`.

### Examples

```bash
cem scan
cem doctor --json > report.json
CEM_PASSWORD=secret cem backup --encrypt --notes "before reinstall"
cem verify backup.cem
cem restore backup.cem --dry-run
cem restore backup.cem --kinds skill,agent --yes
```

## Where CEM stores its own data

| OS | Config & profiles |
| --- | --- |
| Linux | `~/.config/cem/` |
| macOS | `~/Library/Application Support/CEM/` |
| Windows | `%APPDATA%/CEM/` |

Backups default to `~/CEM Backups/` unless you choose another folder.

## Privacy

CEM has **no telemetry**. It reads documented Claude Code files, writes `.cem` archives you control,
and (on restore) your own config files. It never contacts Anthropic servers or modifies Claude Code.
