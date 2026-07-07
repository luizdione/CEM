import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createProfile,
  matchesProfile,
  applyProfile,
  saveProfile,
  loadProfiles,
  deleteProfile,
  PROFILE_TEMPLATES,
  findTemplate,
} from './index.js';
import type { ScannedArtifact } from '@cem/core';

const artifacts: ScannedArtifact[] = [
  art('python-skill', 'skill', 'user', '/home/u/.claude/skills/python/SKILL.md'),
  art('react-agent', 'agent', 'project', '/repo/.claude/agents/react.md'),
  art('memory', 'memory', 'user', '/home/u/.claude/CLAUDE.md'),
];

let dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
  dirs = [];
});

describe('createProfile', () => {
  it('creates a profile with id and timestamps', () => {
    const p = createProfile({ name: 'Dev', include: { kinds: ['skill'] } });
    expect(p.id).toBeTruthy();
    expect(p.createdAt).toBeTruthy();
    expect(p.include.kinds).toEqual(['skill']);
  });

  it('rejects empty names', () => {
    expect(() => createProfile({ name: '  ', include: {} })).toThrow();
  });
});

describe('matchesProfile', () => {
  it('matches by kind', () => {
    const p = createProfile({ name: 'Skills', include: { kinds: ['skill'] } });
    expect(matchesProfile(artifacts[0]!, p)).toBe(true);
    expect(matchesProfile(artifacts[1]!, p)).toBe(false);
  });

  it('matches by path fragment', () => {
    const p = createProfile({ name: 'Python', include: { paths: ['python'] } });
    expect(applyProfile(artifacts, p).map((a) => a.name)).toEqual(['python-skill']);
  });

  it('requires all criteria', () => {
    const p = createProfile({ name: 'X', include: { kinds: ['agent'], scopes: ['project'] } });
    expect(matchesProfile(artifacts[1]!, p)).toBe(true);
    expect(matchesProfile(artifacts[0]!, p)).toBe(false);
  });
});

describe('persistence', () => {
  it('saves, loads and deletes profiles', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cem-prof-'));
    dirs.push(dir);
    const p = createProfile({ name: 'Research', include: { paths: ['research'] } });
    await saveProfile(p, undefined, dir);

    const loaded = await loadProfiles(undefined, dir);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.name).toBe('Research');

    expect(await deleteProfile(p.id, undefined, dir)).toBe(true);
    expect(await loadProfiles(undefined, dir)).toHaveLength(0);
  });
});

describe('templates', () => {
  it('ships example templates', () => {
    expect(PROFILE_TEMPLATES.length).toBeGreaterThanOrEqual(9);
    expect(findTemplate('python')?.name).toBe('Python');
    expect(findTemplate('nope')).toBeUndefined();
  });
});

function art(
  name: string,
  kind: ScannedArtifact['kind'],
  scope: ScannedArtifact['scope'],
  path: string,
): ScannedArtifact {
  return { id: name, kind, scope, path, name, size: 100, mtimeMs: 0 };
}
