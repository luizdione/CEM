# Assets

Brand and documentation assets for CEM.

| File | Purpose |
| --- | --- |
| `logo.svg` | Source logo (recolor/export as needed) |
| `screenshot-*.png` | README screenshots (**placeholders** — add real captures) |

## Generating app icons

From `logo.svg`, export the platform icons into `apps/desktop/build/`:

- `icon.png` — 512×512 (Linux)
- `icon.ico` — multi‑size (Windows)
- `icon.icns` — (macOS)

Any tool works (e.g. `sharp`, `png2icons`, or an online converter). Keep the dark background and the
blue gradient "C" mark for brand consistency.
