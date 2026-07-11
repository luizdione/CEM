# Assets

Brand and documentation assets for CEM.

| File | Purpose |
| --- | --- |
| `logo.svg` | Source logo (recolor/export as needed) |
| `screenshot-*.png` | README screenshots (**placeholders** — add real captures) |

## Generating app icons

Run the generator (one command) to produce `apps/desktop/build/icon.png` (and, with `png2icons`,
`icon.ico` / `icon.icns`) from `logo.svg`:

```bash
pnpm add -Dw sharp png2icons
node scripts/generate-icons.mjs
```

electron‑builder picks up whatever exists in `apps/desktop/build/`. Keep the dark background and the
blue gradient "C" mark for brand consistency.
