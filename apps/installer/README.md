# Installers

CEM desktop installers are produced by [electron‑builder](https://www.electron.build) using the
configuration in [`apps/desktop/electron-builder.yml`](../desktop/electron-builder.yml).

## Targets

| Platform | Format | Notes |
| --- | --- | --- |
| Windows | `.exe` (NSIS) | Per‑user install, choose directory, desktop + start‑menu shortcuts |
| macOS | `.dmg` | Per‑arch artifact (`x64`, `arm64`) |
| Linux | `.AppImage`, `.deb` | Portable AppImage + Debian package |

All targets register the **`.cem` file association**, so double‑clicking a `.cem` opens it in CEM,
and provide an uninstaller (native per platform).

## Building locally

```bash
pnpm install
pnpm --filter @cem/desktop package:linux   # AppImage + deb
pnpm --filter @cem/desktop package:win     # NSIS .exe   (build on Windows)
pnpm --filter @cem/desktop package:mac     # .dmg        (build on macOS)
```

Output is written to `apps/desktop/release/`.

## Icons

Place platform icons in `apps/desktop/build/`:

- `icon.icns` (macOS)
- `icon.ico` (Windows)
- `icon.png` 512×512 (Linux)

If these are absent, electron‑builder uses a default icon. A source logo is provided in
[`assets/logo.svg`](../../assets/logo.svg).

## CI

The [`release.yml`](../../.github/workflows/release.yml) workflow builds all three installers on
tagged releases (`v*.*.*`) and attaches them to the GitHub Release. Code‑signing is disabled by
default; add signing secrets and enable it when you have certificates.
