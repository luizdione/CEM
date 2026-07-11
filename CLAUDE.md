# CLAUDE.md — project memory for Claude Code sessions

## Maintainer environment (Luiz Dione — Windows 10/11, PowerShell 5)

- **Developer copy (git clone, source):** `C:\Users\luizd\OneDrive\Data_Science\Projetos\CEM_desenvolvedor`
  — updated with `git pull` on `main`, then `pnpm install` / `pnpm build:packages`; run with `pnpm dev:desktop`.
- **Usage copy (installed app):** `C:\Program Files\CEM`
  — installed from `install_CEM-x.y.z.exe` (GitHub Releases); updated via the in-app
  auto-updater or by running a newer installer, **never** via git.
- PowerShell 5 does not accept `&&` — give commands one per line.

## Repo conventions

- Default branch: `main`. Releases are tag-driven: pushing `vX.Y.Z` runs
  `.github/workflows/release.yml`, which builds the Windows `.exe`, macOS `.dmg`,
  Linux AppImage + `.deb` and the CLI tarball and attaches them to the GitHub Release.
- pnpm ≥ 10: build-script approvals live in `pnpm-workspace.yaml`
  (`onlyBuiltDependencies: electron, esbuild`) — do not move them to `package.json`.
- The desktop package name is scoped (`@cem/desktop`); Linux artifacts ship under the
  flat name `cem-desktop` via `extraMetadata.name` in `apps/desktop/electron-builder.yml`.
- Compliance: CEM must never modify, intercept or reverse-engineer Claude Code or any
  Anthropic software — it only reads/writes the user's own documented local files.

## Common commands

- `pnpm build` — packages + CLI; `pnpm build:packages` — packages only
- `pnpm test` / `pnpm lint` / `pnpm typecheck`
- `pnpm dev:desktop` — run the Electron app in dev mode
