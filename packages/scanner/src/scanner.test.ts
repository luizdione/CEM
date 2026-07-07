import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanEnvironment, discoverProjectRoots, countByKind, filterArtifacts } from './index.js';

let home: string;

beforeAll(async () => {
  home = await mkdtemp(join(tmpdir(), 'cem-scan-'));
  const claude = join(home, '.claude');
  await mkdir(join(claude, 'skills', 'my-skill'), { recursive: true });
  await mkdir(join(claude, 'agents'), { recursive: true });
  await mkdir(join(claude, 'commands'), { recursive: true });

  await writeFile(join(home, '.claude.json'), JSON.stringify({ projects: {} }));
  await writeFile(join(claude, 'settings.json'), JSON.stringify({ theme: 'dark' }));
  await writeFile(join(claude, 'CLAUDE.md'), '# Memory\n\nUse strict TypeScript.\n');
  await writeFile(
    join(claude, 'skills', 'my-skill', 'SKILL.md'),
    '---\nname: my-skill\n---\n\nDo the thing.\n',
  );
  await writeFile(join(claude, 'agents', 'reviewer.md'), '# Reviewer agent\n');
  await writeFile(join(claude, 'commands', 'deploy.md'), '# /deploy\n');
});

afterAll(async () => {
  await rm(home, { recursive: true, force: true });
});

describe('scanEnvironment', () => {
  it('discovers user-level artifacts and classifies them', async () => {
    const result = await scanEnvironment({ home, discoverProjects: false, computeTokens: true });
    const counts = countByKind(result.artifacts);

    expect(result.artifacts.length).toBeGreaterThanOrEqual(5);
    expect(counts.skill).toBeGreaterThanOrEqual(1);
    expect(counts.agent).toBeGreaterThanOrEqual(1);
    expect(counts.command).toBeGreaterThanOrEqual(1);
    expect(counts.memory).toBeGreaterThanOrEqual(1);

    const memory = result.artifacts.find((a) => a.name === 'CLAUDE.md');
    expect(memory?.tokens).toBeGreaterThan(0);
  });

  it('marks the user config as sensitive', async () => {
    const result = await scanEnvironment({ home, discoverProjects: false });
    const cfg = result.artifacts.find((a) => a.name === '.claude.json');
    expect(cfg?.sensitive).toBe(true);
  });

  it('supports filtering', async () => {
    const result = await scanEnvironment({ home, discoverProjects: false });
    const skills = filterArtifacts(result.artifacts, { kinds: ['skill'] });
    expect(skills.every((a) => a.kind === 'skill')).toBe(true);
  });
});

describe('discoverProjectRoots', () => {
  it('returns empty when there are no recorded projects', async () => {
    expect(await discoverProjectRoots(home)).toEqual([]);
  });

  it('extracts absolute project paths', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'cem-proj-'));
    await writeFile(
      join(tmp, '.claude.json'),
      JSON.stringify({ projects: { '/abs/project': {}, relative: {} } }),
    );
    const roots = await discoverProjectRoots(tmp);
    expect(roots).toContain('/abs/project');
    expect(roots).not.toContain('relative');
    await rm(tmp, { recursive: true, force: true });
  });
});
