import { join } from 'node:path';
import {
  ValidationError,
  ensureDir,
  generateId,
  nowIso,
  pathExists,
  readJson,
  removePath,
  slugify,
  walk,
  writeJson,
} from '@cem/shared';
import {
  type Profile,
  type ProfileSelection,
  type ScannedArtifact,
  getCemProfilesDir,
  type PathEnv,
} from '@cem/core';

export interface CreateProfileInput {
  readonly name: string;
  readonly description?: string;
  readonly include: ProfileSelection;
  readonly tags?: readonly string[];
}

/** Build a new profile with generated id and timestamps. */
export function createProfile(input: CreateProfileInput): Profile {
  if (!input.name.trim()) throw new ValidationError('Profile name is required.');
  const now = nowIso();
  return {
    id: generateId(),
    name: input.name.trim(),
    ...(input.description ? { description: input.description } : {}),
    createdAt: now,
    updatedAt: now,
    include: input.include,
    ...(input.tags ? { tags: input.tags } : {}),
  };
}

/**
 * Decide whether an artifact belongs to a profile. Every specified (non-empty)
 * criterion must match; unspecified criteria do not restrict.
 */
export function matchesProfile(artifact: ScannedArtifact, profile: Profile): boolean {
  const { kinds, scopes, paths, names } = profile.include;

  if (kinds && kinds.length > 0 && !kinds.includes(artifact.kind)) return false;
  if (scopes && scopes.length > 0 && !scopes.includes(artifact.scope)) return false;
  if (paths && paths.length > 0) {
    const path = artifact.path.toLowerCase();
    if (!paths.some((fragment) => path.includes(fragment.toLowerCase()))) return false;
  }
  if (names && names.length > 0) {
    const name = artifact.name.toLowerCase();
    if (!names.some((n) => name.includes(n.toLowerCase()) || artifact.id === n)) return false;
  }
  return true;
}

/** Return the subset of artifacts that match a profile. */
export function applyProfile(
  artifacts: readonly ScannedArtifact[],
  profile: Profile,
): ScannedArtifact[] {
  return artifacts.filter((artifact) => matchesProfile(artifact, profile));
}

function profileFilePath(dir: string, profile: Pick<Profile, 'id' | 'name'>): string {
  return join(dir, `${slugify(profile.name)}-${profile.id.slice(0, 8)}.json`);
}

/** Persist a profile as JSON under the CEM profiles directory. */
export async function saveProfile(profile: Profile, env?: PathEnv, dir?: string): Promise<string> {
  const target = dir ?? getCemProfilesDir(env);
  await ensureDir(target);
  const file = profileFilePath(target, profile);
  await writeJson(file, { ...profile, updatedAt: nowIso() });
  return file;
}

/** Load all persisted profiles. */
export async function loadProfiles(env?: PathEnv, dir?: string): Promise<Profile[]> {
  const target = dir ?? getCemProfilesDir(env);
  if (!(await pathExists(target))) return [];
  const files = await walk(target, { maxDepth: 0 });
  const profiles: Profile[] = [];
  for (const file of files) {
    if (!file.path.endsWith('.json')) continue;
    try {
      profiles.push(await readJson<Profile>(file.path));
    } catch {
      // skip invalid profile files
    }
  }
  return profiles.sort((a, b) => a.name.localeCompare(b.name));
}

/** Delete a profile file by id. Returns true when something was removed. */
export async function deleteProfile(id: string, env?: PathEnv, dir?: string): Promise<boolean> {
  const target = dir ?? getCemProfilesDir(env);
  const profiles = await loadProfiles(env, target);
  const match = profiles.find((p) => p.id === id);
  if (!match) return false;
  await removePath(profileFilePath(target, match));
  return true;
}
