# The `.cem` Archive Format

**Format version:** `1.0.0`
**Container:** ZIP (Deflate)
**Extension:** `.cem`

A `.cem` file is a portable, verifiable, optionally‑encrypted snapshot of a Claude Code environment.
It is a plain ZIP archive so it can be inspected with any ZIP tool, but CEM adds a manifest,
per‑file checksums and an optional encrypted payload.

## Top‑level layout

### Unencrypted archive

```
archive.cem  (ZIP)
├── manifest.json        # metadata: version, host, content summary, encryption header
├── checksums.json       # { archivePath: sha256 } for every content file
├── entries.json         # detailed file table with restore targets
├── config.json          # backup options snapshot
├── skills/…             # content, organized by category
├── agents/…
├── commands/…
├── mcp/…
├── markdown/…
├── config/…
├── projects/…
└── logs/backup.log
```

### Encrypted archive

```
archive.cem  (ZIP)
├── manifest.json        # includes encryption header (algorithm, kdf, salt, iv, authTag)
└── payload.enc          # AES-256-GCM ciphertext of an inner ZIP containing everything
                         # above except manifest.json
```

When encrypted, the **manifest stays readable** (so you can inspect version, host and counts
without the password), but all file contents, the checksum table and the entries table are inside
the encrypted payload.

## `manifest.json`

```jsonc
{
  "formatVersion": "1.0.0",
  "cemVersion": "1.0.0",
  "id": "9b1e…-uuid",
  "createdAt": "2025-01-31T14:05:09.123Z",
  "host": {
    "os": "Darwin 23.5.0",
    "platform": "darwin",
    "arch": "arm64",
    "nodeVersion": "v20.11.0",
    "claudeVersion": "1.2.3",     // when detected
    "hostname": "…"                // only when the user opts in
  },
  "encryption": {
    "enabled": true,
    "algorithm": "AES-256-GCM",
    "kdf": "argon2id",
    "salt": "base64…",
    "iv": "base64…",
    "authTag": "base64…",
    "kdfParams": { "memoryCost": 65536, "timeCost": 3, "parallelism": 1 }
  },
  "contents": {
    "skills": 4, "agents": 2, "mcpServers": 3, "markdownFiles": 6,
    "plugins": 0, "profiles": 0, "commands": 5, "configFiles": 3,
    "totalFiles": 23, "totalBytes": 148213
  },
  "profilesIncluded": [],
  "notes": "optional user note"
}
```

The `encryption` object never contains the password or the derived key — only public parameters
(salt, IV, auth tag, KDF settings) needed to derive the key again from the correct password.

## `entries.json`

An array describing every content file and **how to restore it**:

```jsonc
[
  {
    "archivePath": "skills/my-skill/SKILL.md",
    "kind": "skill",
    "scope": "user",
    "size": 812,
    "sha256": "…",
    "originalPath": "/Users/alice/.claude/skills/my-skill/SKILL.md",
    "restore": {
      "base": "home",            // "home" | "project" | "absolute"
      "relative": ".claude/skills/my-skill/SKILL.md",
      "projectSlug": null,       // set for project-scoped files
      "projectRoot": null
    }
  }
]
```

### Restore targets

Portability across machines comes from the `restore` object, not from absolute paths:

| `base` | Restored to |
| --- | --- |
| `home` | `<targetHome>/<relative>` |
| `project` | `<projectBaseDir>/<projectSlug>/<relative>` (default `<home>/CEM Restored Projects/…`) |
| `absolute` | `<externalBaseDir>/<basename>` (default `<home>/CEM Restored External/…`) |

This lets a backup created under `/Users/alice` restore cleanly under `/home/bob`.

## `checksums.json`

```jsonc
{ "skills/my-skill/SKILL.md": "sha256hex…", "markdown/CLAUDE.md": "sha256hex…" }
```

Every content file is hashed with SHA‑256 at backup time. On restore, CEM recomputes and compares
each hash **before writing anything to disk**. If any file fails (or, for encrypted archives, if the
GCM auth tag is invalid), the restore is refused.

## Category directories

Content is grouped by category for browsability. The mapping from artifact kind → directory:

| Kind | Directory |
| --- | --- |
| skill | `skills/` |
| agent | `agents/` |
| command | `commands/` |
| mcp | `mcp/` |
| plugin | `plugins/` |
| memory / markdown / prompt / template | `markdown/` |
| config / setting | `config/` |
| project | `projects/` |
| (profiles) | `profiles/` |
| other | `misc/` |

Within a category, project‑scoped files are namespaced as `<category>/project-<slug>/…` and external
files as `<category>/external/…` to guarantee uniqueness.

## Versioning & compatibility

- The archive is restorable when its **major** `formatVersion` matches the reader's. Newer
  minor/patch archives are read best‑effort.
- KDF parameters are stored per archive, so defaults can be strengthened over time without breaking
  older archives.
