# Import Flow — Migrating to a New Machine

This is the headline use case: reinstall your Claude Code environment on a fresh computer with a few
clicks.

## On the old machine

1. Install and open CEM (or use the CLI).
2. **Scan** to confirm what will be captured (read‑only).
3. **Backup** → choose *Encrypt* if the environment contains secrets → get `environment.cem`.
4. Copy `environment.cem` to the new machine (USB, cloud, `scp`, …). CEM never uploads it for you.

```bash
CEM_PASSWORD='••••••' cem backup --encrypt --out ~/Desktop --name environment.cem
```

## On the new machine

1. Install **Claude Code** (from Anthropic — CEM does not install or modify it).
2. Install **CEM**.
3. **Restore/Import** the `.cem`:

```bash
cem import environment.cem --dry-run     # preview
CEM_PASSWORD='••••••' cem import environment.cem --yes
```

Or in the desktop app: **Restore → choose file → Verify & preview → Restore now**.

4. Start Claude Code — your memory, skills, agents, commands, MCP configuration and settings are
   back in place.

## What gets restored where

| Source (old machine) | Restored (new machine) |
| --- | --- |
| `~/.claude/**` | `<newHome>/.claude/**` |
| `~/.claude.json` | `<newHome>/.claude.json` |
| project `CLAUDE.md`, `.mcp.json`, `.claude/**` | under `<newHome>/CEM Restored Projects/<slug>/…` (remappable) |

Because restore targets are relative to the home directory (not absolute), a backup from
`/Users/alice` restores correctly under `/home/bob`.

## Notes & caveats

- **Secrets**: MCP servers may reference API keys via environment values. Encrypt the backup to keep
  them safe in transit. After restore, verify the keys are still valid for the new machine.
- **Projects**: project files restore into a staging folder by default so they never clobber
  unrelated repos. Point `--project-dir` at your workspace to place them precisely.
- **Conflicts**: existing files are skipped unless you pass `--overwrite`.
- **Integrity**: import refuses to run if checksums or the encryption auth tag don't verify.
