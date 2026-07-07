import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathExists } from '@cem/shared';
import { backupEnvironment } from '@cem/backup';
import { readCemArchive, readManifest, verifyArchive, restoreFromFile } from '@cem/restore';

let sourceHome: string;
let outDir: string;
let targetHome: string;

async function seedEnvironment(home: string): Promise<void> {
  const claude = join(home, '.claude');
  await mkdir(join(claude, 'skills', 'my-skill'), { recursive: true });
  await mkdir(join(claude, 'agents'), { recursive: true });
  await mkdir(join(claude, 'commands'), { recursive: true });
  await writeFile(join(home, '.claude.json'), JSON.stringify({ projects: {} }, null, 2));
  await writeFile(join(claude, 'settings.json'), JSON.stringify({ theme: 'dark' }, null, 2));
  await writeFile(join(claude, 'CLAUDE.md'), '# Memory\n\nAlways write tests.\n');
  await writeFile(join(claude, 'skills', 'my-skill', 'SKILL.md'), '---\nname: my-skill\n---\nBody\n');
  await writeFile(join(claude, 'agents', 'reviewer.md'), '# Reviewer\n');
  await writeFile(join(claude, 'commands', 'deploy.md'), '# /deploy\n');
}

beforeEach(async () => {
  sourceHome = await mkdtemp(join(tmpdir(), 'cem-src-'));
  targetHome = await mkdtemp(join(tmpdir(), 'cem-dst-'));
  outDir = await mkdtemp(join(tmpdir(), 'cem-out-'));
  await seedEnvironment(sourceHome);
});

afterEach(async () => {
  await Promise.all(
    [sourceHome, targetHome, outDir].map((d) => rm(d, { recursive: true, force: true })),
  );
});

describe('unencrypted backup → restore', () => {
  it('round-trips the environment onto a fresh machine', async () => {
    const backup = await backupEnvironment({
      home: sourceHome,
      outDir,
      discoverProjects: false,
      computeTokens: false,
    });

    expect(backup.encrypted).toBe(false);
    expect(backup.fileCount).toBeGreaterThanOrEqual(6);
    expect(await pathExists(backup.path)).toBe(true);

    // Manifest is readable without a password.
    const manifest = await readManifest(backup.path);
    expect(manifest.formatVersion).toBe('1.0.0');
    expect(manifest.contents.skills).toBeGreaterThanOrEqual(1);

    // Integrity verifies.
    const archive = await readCemArchive(backup.path);
    expect(verifyArchive(archive).ok).toBe(true);

    // Restore onto the target home.
    const { verify, result } = await restoreFromFile(backup.path, { home: targetHome });
    expect(verify.ok).toBe(true);
    expect(result.restored.length).toBeGreaterThanOrEqual(6);

    // Content matches the original, byte-for-byte.
    const restoredMemory = await readFile(join(targetHome, '.claude', 'CLAUDE.md'), 'utf8');
    const originalMemory = await readFile(join(sourceHome, '.claude', 'CLAUDE.md'), 'utf8');
    expect(restoredMemory).toBe(originalMemory);

    const restoredSkill = await readFile(
      join(targetHome, '.claude', 'skills', 'my-skill', 'SKILL.md'),
      'utf8',
    );
    expect(restoredSkill).toContain('name: my-skill');
  });

  it('reports conflicts and honors dry-run', async () => {
    const backup = await backupEnvironment({
      home: sourceHome,
      outDir,
      discoverProjects: false,
    });
    // Restore once to populate target.
    await restoreFromFile(backup.path, { home: targetHome });
    // Dry-run second restore should detect conflicts and write nothing new.
    const { result } = await restoreFromFile(backup.path, { home: targetHome, dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.conflicts.length).toBeGreaterThan(0);
  });

  it('supports selective restore by kind', async () => {
    const backup = await backupEnvironment({ home: sourceHome, outDir, discoverProjects: false });
    const { result } = await restoreFromFile(backup.path, {
      home: targetHome,
      kinds: ['skill'],
    });
    expect(result.restored.every((p) => p.includes('skills'))).toBe(true);
    expect(await pathExists(join(targetHome, '.claude', 'CLAUDE.md'))).toBe(false);
  });
});

describe('encrypted backup → restore', () => {
  const password = 'correct horse battery staple';

  it('encrypts the payload and restores with the password', async () => {
    const backup = await backupEnvironment({
      home: sourceHome,
      outDir,
      discoverProjects: false,
      password,
    });
    expect(backup.encrypted).toBe(true);
    expect(backup.manifest.encryption.enabled).toBe(true);
    expect(backup.manifest.encryption.algorithm).toBe('AES-256-GCM');

    // Manifest metadata is still readable without the password.
    const manifest = await readManifest(backup.path);
    expect(manifest.contents.totalFiles).toBe(backup.fileCount);

    // Reading content without a password fails.
    await expect(readCemArchive(backup.path)).rejects.toThrow(/encrypted/i);
    // Wrong password fails.
    await expect(readCemArchive(backup.path, 'nope')).rejects.toThrow();

    // Correct password restores successfully.
    const { verify, result } = await restoreFromFile(backup.path, { home: targetHome, password });
    expect(verify.ok).toBe(true);
    expect(result.restored.length).toBeGreaterThanOrEqual(6);
    const restored = await readFile(join(targetHome, '.claude', 'settings.json'), 'utf8');
    expect(JSON.parse(restored).theme).toBe('dark');
  });
});
