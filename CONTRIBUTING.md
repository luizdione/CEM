# Contributing to CEM

Thanks for your interest in improving the **Claude Environment Manager**! This project is open
source under the MIT license and welcomes issues, discussions and pull requests.

## Ground rules

CEM has one non‑negotiable rule that every contribution must respect:

> **CEM must never modify, patch, reverse‑engineer, intercept or otherwise interfere with Claude
> Code or any Anthropic software.** It may only read/write the user's own local files in documented
> locations, use public/supported mechanisms (CLI, MCP, documented config), and must respect the
> Anthropic Terms of Use.

Pull requests that violate this rule will be declined regardless of technical quality.

## Development setup

```bash
# Node.js >= 20 and pnpm >= 9
pnpm install
pnpm build          # build packages + CLI
pnpm test           # run the test suite
pnpm lint           # eslint
pnpm typecheck      # tsc across the repo
pnpm format         # prettier --write
```

Useful scoped commands:

```bash
pnpm --filter @cem/scanner test
pnpm dev:cli -- scan --home /path/to/fake/home
pnpm dev:desktop
```

## Project layout

- `packages/*` — framework‑agnostic domain logic (each is independent and reusable).
- `apps/cli` — the `cem` command.
- `apps/desktop` — the Electron + React UI.
- `tests/` — integration tests.

## Coding standards

- **TypeScript strict mode**; no `any` unless truly unavoidable (prefer `unknown`).
- Follow **SOLID / DRY / KISS / Clean Code**. Keep functions small and single‑purpose.
- New behavior needs **tests**. We use [Vitest](https://vitest.dev).
- Run `pnpm lint` and `pnpm format` before committing.
- Public functions get a short doc comment describing intent.

## Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org):

```
feat(scanner): detect project-scoped .mcp.json
fix(restore): honor --overwrite in dry-run summary
docs: document the .cem format
```

The changelog is generated from these prefixes.

## Pull request checklist

- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm test` all pass.
- [ ] New/changed behavior is covered by tests.
- [ ] Docs updated if behavior or the `.cem` format changed.
- [ ] The change respects the compliance rule above.

## Adding a new module

Because CEM is modular, most features are a new package under `packages/` or a new command/view:

1. Copy the shape of an existing package (`package.json`, `tsconfig.json`, `tsup.config.ts`).
2. Depend on `@cem/shared` / `@cem/core` as needed; keep it independent of UI.
3. Export a clean public API from `src/index.ts`.
4. Add tests and wire it into the CLI and/or desktop via a thin adapter.

Thank you for helping make CEM better! 💙
