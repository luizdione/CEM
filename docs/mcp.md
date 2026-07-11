# MCP Manager

The MCP manager discovers, inspects and edits **MCP server definitions** across the documented
config files. It is careful about two things:

1. **Compliance** — CEM only reads and writes the *declarative configuration* in your own files
   (`~/.claude.json`, `~/.claude/settings.json`, project `.mcp.json`, `claude_desktop_config.json`).
   It never starts, stops, installs or executes an MCP server.
2. **Secrets** — environment values are masked in every display; they are only written when you
   explicitly export or import.

## Discovery (read‑only)

```ts
import { discoverMcpServers, redactServers } from '@cem/mcp';
const servers = redactServers(await discoverMcpServers({ home }));
```

Each `McpServerDefinition` records its `name`, `transport` (`stdio` / `sse` / `http`), `command`/
`args`/`url`/`env`, `scope` and the `sourcePath` it was parsed from.

```bash
cem mcp list            # masked
cem mcp list --reveal   # show env values (your own data)
```

## Editing (writes to your own files)

```ts
import { exportServers, importServers, upsertServers,
         setServerDisabled, removeServer } from '@cem/mcp';
```

| Operation | CLI | Effect |
| --- | --- | --- |
| Export | `cem mcp export <file>` | Write selected servers to a standalone `mcp.json` |
| Import | `cem mcp import <file> --into <config>` | Merge servers into a config file (keys preserved) |
| Disable | `cem mcp disable <name> --config <file>` | Set `disabled: true` on a server |
| Enable | `cem mcp enable <name> --config <file>` | Remove the `disabled` flag |
| Remove | `cem mcp remove <name> --config <file>` | Delete a server entry |

Merging is **non‑destructive**: other keys in the target file (e.g. `theme`) are preserved, and
existing servers are skipped unless you pass `--overwrite`.

```bash
# Move MCP servers from one machine's config to a portable file, then into another
cem mcp export ~/mcp-backup.json
cem mcp import ~/mcp-backup.json --into ~/.claude/settings.json
```

## Desktop

The **MCP Servers** view lists every server with **Export…** / **Import…** buttons and per‑server
**Enable/Disable** and **Remove** actions. Servers declared inside a nested block of `~/.claude.json`
(per‑project `mcpServers`) are shown but flagged as not editable in place — edit that file directly.

## Audit

Every edit (export, import, enable/disable, remove) is written to CEM's audit log
(`logs/audit.log`) — see [`backup-system.md`](./backup-system.md#registry--audit-log).
