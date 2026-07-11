# Problem Remediation ("Solve problems")

Since **1.1.0**, CEM's diagnostics don't just identify problems — they can **fix** them. The
remediation engine turns each diagnostic finding into a concrete fix proposal that the user
**accepts or ignores individually**.

## Flow

```
doctor/diagnose  →  propose fixes  →  user reviews each  →  accept / ignore  →  apply + backup + audit
```

1. **Diagnose** — the standard read‑only diagnosis runs (broken MCP configs, duplicates, orphan
   references, token bloat…).
2. **Propose** (`proposeRemediations`) — each finding is mapped to its best fix. Every proposal
   states what will change, whether it is automatic, and whether it deletes anything.
3. **Review** — nothing happens without consent. In the CLI each fix asks `Apply this fix? [y/N]`;
   in the desktop each card has **Accept** / **Ignore** buttons.
4. **Apply** (`applyRemediation`) — accepted fixes run one at a time. Before any destructive change,
   the affected file is copied to **CEM's trash** (`<CEM data dir>/trash/<timestamp>/…`), and the
   operation is appended to the audit log.

## Built‑in fixes

| Finding | Proposed fix | Automatic | Destructive |
| --- | --- | --- | --- |
| MCP server with no `command`/`url` | Remove the server entry from its config file | ✅ | ✅ (config backed up) |
| Identical duplicate files | Keep one copy, remove the rest | ✅ | ✅ (removed files backed up) |
| Reference to a missing file | Create the missing file as an empty stub | ✅ | ❌ |
| MCP problem inside a nested `~/.claude.json` project block | Guidance to edit that file directly | ❌ (manual) | — |
| Token‑heavy document | Guidance to split/trim the document | ❌ (manual) | — |

## Usage

### CLI

```bash
cem fix                # interactive: review and accept/ignore each fix
cem fix --dry-run      # only show what would be done
cem fix -y             # apply all automatic fixes without prompting
cem fix --json         # machine-readable proposals/results
```

### Desktop

**Diagnostics → Solve problems** lists every proposal with badges (`auto`, `auto · deletes`,
`manual`). Click **Accept** to apply a fix (the result and backup path are shown inline) or
**Ignore** to skip it. The diagnosis re‑runs automatically after each applied fix.

### API

```ts
import { diagnoseEnvironment, proposeRemediations, applyRemediation } from '@cem/diagnostics';

const diagnosis = await diagnoseEnvironment({ home });
const proposals = proposeRemediations(diagnosis.report);
for (const p of proposals.filter((p) => p.automatic)) {
  const result = await applyRemediation(p); // { ok, applied, message, backup? }
}
```

## Recovering from a fix

Every destructive fix backs up the affected files to CEM's trash first:

| OS | Trash location |
| --- | --- |
| Linux | `~/.config/cem/trash/<timestamp>/` |
| macOS | `~/Library/Application Support/CEM/trash/<timestamp>/` |
| Windows | `%APPDATA%/CEM/trash/<timestamp>/` |

Copy a file back from there to undo a fix. Applied fixes are also recorded in the audit log
(`cem history log`).

## Scope & compliance

Remediation operates **only on the user's own Claude Code data files** (config JSON, markdown,
skills/agents files). It never modifies Claude Code or any Anthropic software, never runs arbitrary
system commands, and never acts without explicit per‑fix consent.
