import { defineConfig } from 'tsup';

// Bundle everything (including @cem/* workspace packages) into a single,
// self-contained executable so the CLI can be distributed and run standalone.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  sourcemap: true,
  dts: false,
  shims: true,
  banner: { js: '#!/usr/bin/env node' },
});
