# Profiles

A **profile** activates a subset of your configuration and documentation for a given workflow, so a
backup (or a review) can focus on just what's relevant — e.g. *Bioinformatics*, *Python*, *Next.js*,
*Docker*, *Company*.

## Model

```ts
interface Profile {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  include: {
    kinds?: ArtifactKind[];        // e.g. ['skill','agent','memory']
    paths?: string[];              // substring match on the artifact path
    names?: string[];              // substring match on the name (or exact id)
    scopes?: ArtifactScope[];      // 'user' | 'project' | 'plugin' | 'desktop'
  };
  tags?: string[];
}
```

## Matching rules

An artifact belongs to a profile when it satisfies **every specified** criterion. Unspecified
criteria do not restrict. For example `{ kinds: ['agent'], scopes: ['project'] }` matches only
project‑scoped agents.

```ts
import { matchesProfile, applyProfile } from '@cem/profiles';
const selected = applyProfile(scan.artifacts, profile);
```

## Templates

Ready‑made starting points (`PROFILE_TEMPLATES`): Development, Research, Bioinformatics, Python,
Next.js, React, Docker, Farm (Fazenda), Company (Empresa).

```bash
cem profiles templates
cem profiles create "My Python" --from-template Python
cem profiles list
cem backup --profile "My Python"     # back up only matching artifacts
```

## Storage

Profiles are saved as JSON under CEM's own data directory:

- Linux: `~/.config/cem/profiles/`
- macOS: `~/Library/Application Support/CEM/profiles/`
- Windows: `%APPDATA%/CEM/profiles/`

They are CEM's own files — never Claude Code's.
