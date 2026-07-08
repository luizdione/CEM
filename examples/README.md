# Examples

A small, self‑contained sample Claude Code environment you can point CEM at — without touching your
real `~/.claude`.

```
examples/sample-claude-home/
├── .claude.json                       # user config (empty projects)
└── .claude/
    ├── settings.json                  # includes a sample MCP server
    ├── CLAUDE.md                      # user memory
    ├── coding.md                      # a related doc (picked up by the deep sweep)
    ├── skills/git-helper/SKILL.md
    ├── agents/reviewer.md
    └── commands/deploy.md
```

## Try it

Build the CLI first (`pnpm build`), then run against the sample home:

```bash
CLI="node apps/cli/dist/index.js"

# Discover artifacts (read-only)
$CLI scan   --home examples/sample-claude-home

# Health check
$CLI doctor --home examples/sample-claude-home

# List MCP servers (secrets masked)
$CLI mcp list --home examples/sample-claude-home

# Create a backup into a temp folder
$CLI backup --home examples/sample-claude-home --out /tmp/cem-demo --name demo.cem

# Verify and restore it somewhere else
$CLI verify  /tmp/cem-demo/demo.cem
$CLI restore /tmp/cem-demo/demo.cem --home /tmp/cem-restored --yes
```

Or run the one‑shot demo script:

```bash
node scripts/demo.mjs
```

Nothing here affects your real environment — everything is scoped to the `--home` you pass.
