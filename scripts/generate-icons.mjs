#!/usr/bin/env node
/**
 * Generate desktop app icons from assets/logo.svg into apps/desktop/build/.
 *
 * Requires `sharp` for rasterization and, optionally, `png2icons` for the
 * Windows/macOS icon containers:
 *
 *   pnpm add -Dw sharp png2icons
 *   node scripts/generate-icons.mjs
 *
 * Without these dev deps the script prints instructions and exits. Generated
 * icons (build/icon.png, icon.ico, icon.icns) are picked up automatically by
 * electron-builder.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svgPath = resolve(root, 'assets/logo.svg');
const outDir = resolve(root, 'apps/desktop/build');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('This script needs `sharp`. Install it first:\n  pnpm add -Dw sharp png2icons');
  process.exit(1);
}

const svg = await readFile(svgPath);
await mkdir(outDir, { recursive: true });

const pngBuffer = await sharp(svg, { density: 384 }).resize(1024, 1024).png().toBuffer();
await writeFile(resolve(outDir, 'icon.png'), pngBuffer);
console.log('✓ wrote apps/desktop/build/icon.png (1024×1024)');

try {
  const png2icons = await import('png2icons');
  const ico = png2icons.createICO(pngBuffer, png2icons.BILINEAR, 0, false);
  const icns = png2icons.createICNS(pngBuffer, png2icons.BILINEAR, 0);
  if (ico) {
    await writeFile(resolve(outDir, 'icon.ico'), ico);
    console.log('✓ wrote apps/desktop/build/icon.ico');
  }
  if (icns) {
    await writeFile(resolve(outDir, 'icon.icns'), icns);
    console.log('✓ wrote apps/desktop/build/icon.icns');
  }
} catch {
  console.log('ℹ png2icons not installed — skipped .ico/.icns (install it to generate them).');
}

console.log('Done. electron-builder will use these icons automatically.');
