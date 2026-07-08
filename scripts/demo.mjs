#!/usr/bin/env node
/**
 * One-shot demo: scan → backup → verify → restore against the sample
 * environment in examples/sample-claude-home. Everything runs in a temp folder;
 * your real ~/.claude is never touched.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'apps/cli/dist/index.js');
const home = join(root, 'examples/sample-claude-home');
const work = mkdtempSync(join(tmpdir(), 'cem-demo-'));
const outDir = join(work, 'backups');
const restoreHome = join(work, 'restored');

function run(args) {
  console.log(`\n$ cem ${args.join(' ')}`);
  const result = spawnSync('node', [cli, ...args], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log('CEM demo — using a disposable temp folder:', work);
run(['scan', '--home', home]);
run(['doctor', '--home', home]);
run(['mcp', 'list', '--home', home]);
run(['backup', '--home', home, '--out', outDir, '--name', 'demo.cem']);
run(['verify', join(outDir, 'demo.cem')]);
run(['restore', join(outDir, 'demo.cem'), '--home', restoreHome, '--yes']);
console.log('\n✓ Demo complete. Restored environment at:', restoreHome);
