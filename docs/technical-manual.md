# Technical Manual

A concise reference for developers building, testing, releasing and packaging CEM. For the design,
see [`architecture.md`](./architecture.md); for package APIs, [`api.md`](./api.md).

## Prerequisites

- Node.js ≥ 20, pnpm ≥ 9.
- No native toolchain required — cryptography uses pure‑WASM Argon2 (`hash-wasm`) and Node's built‑in
  `crypto`; archives use pure‑JS ZIP (`fflate`).

## Commands

```bash
pnpm install            # install workspace deps
pnpm build              # build all packages + CLI (topological, tsup)
pnpm build:packages     # packages only
pnpm build:desktop      # electron-vite build (main + preload + renderer)
pnpm test               # vitest (unit + integration)
pnpm test:coverage      # coverage report
pnpm lint               # eslint (flat config)
pnpm format             # prettier --write
pnpm typecheck          # tsc across the repo (no build needed)
```

## Repository conventions

- **ESM everywhere.** Packages export ESM + `.d.ts` via tsup.
- **Root typecheck** uses path aliases to source, so `pnpm typecheck` needs no prior build.
- **Tests run on source** through Vitest aliases (`vitest.config.ts`) — no build needed to test.
- **CLI** is bundled into a single self‑contained file with a `#!/usr/bin/env node` banner.

## Testing strategy

| Level | Where | What |
| --- | --- | --- |
| Unit | `packages/*/src/*.test.ts` | pure logic (crypto, planning, parsing, matching) |
| Integration | `tests/integration/*.test.ts` | full backup → verify → restore round‑trip, encrypted & not |

## Releasing

1. Update `CHANGELOG.md` and bump versions (SemVer).
2. Tag: `git tag v1.2.3 && git push --tags`.
3. The **Release** workflow builds installers on Windows, macOS and Linux and uploads artifacts.

## Packaging installers

`apps/desktop` uses [electron‑builder](https://www.electron.build) (`electron-builder.yml`):

```bash
pnpm --filter @cem/desktop package:linux   # AppImage + deb
pnpm --filter @cem/desktop package:win     # NSIS .exe
pnpm --filter @cem/desktop package:mac     # .dmg
```

All targets register the `.cem` file association. See [`apps/installer/README.md`](../apps/installer/README.md).

## CI

`.github/workflows/ci.yml` runs lint, typecheck, tests (with coverage) and a package/CLI build on
every push and PR. `build.yml` cross‑builds the desktop app on all three OSes. `release.yml`
publishes installers on tags.
