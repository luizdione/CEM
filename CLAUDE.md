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

## Session state (updated 2026-07-17)

- Shipped: releases v1.3.0 → **v1.3.2** with all installers attached. v1.3.1 = load-class-aware
  token-usage insights; v1.3.2 = UI-freeze fix (async fflate zip/unzip off the main thread,
  transcript parser yields, visible "backing-up" updater status).
- **Marketing in progress.** Ready-to-post material lives in `marketing/` (video shooting
  script with EN captions, Discord posts EN/PT, Reddit kit for u/According-Author-953 with
  account warm-up plan). The user is recording a demo video; it must be **attached in the
  chat** to reach the remote container (local Windows paths are unreachable). Editing plan:
  ffmpeg (static build via `pip3 install imageio-ffmpeg`), map scenes by sampling frames,
  cut + title cards + burn EN subtitles → deliver `CEM-demo-EN.mp4`, `.srt`, GIF ≤10 MB.
- Pending on the user's machine: apply the local skill-slimming plan (CEM-PLANO-LOCAL.md,
  delivered in chat) via their local Claude Code; Reddit karma warm-up before posting.

## Common commands

- `pnpm build` — packages + CLI; `pnpm build:packages` — packages only
- `pnpm test` / `pnpm lint` / `pnpm typecheck`
- `pnpm dev:desktop` — run the Electron app in dev mode
