import { homedir } from 'node:os';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { slugify } from '@cem/shared';
import {
  type ArtifactKind,
  type RestoreTarget,
  type ScannedArtifact,
  categoryDirForKind,
} from '@cem/core';
import { sha256 } from '@cem/crypto';

/** Subdirectory (under `.claude`) that holds a given artifact kind. */
const KIND_SUBDIR: Partial<Record<ArtifactKind, string>> = {
  skill: 'skills',
  agent: 'agents',
  command: 'commands',
  plugin: 'plugins',
  project: 'projects',
};

export interface ProjectRootRef {
  readonly root: string;
  readonly slug: string;
}

export interface PlanContext {
  readonly home?: string;
  readonly projectRoots?: readonly string[];
}

export interface PlannedFile {
  readonly sourcePath: string;
  readonly archivePath: string;
  readonly kind: ArtifactKind;
  readonly scope: ScannedArtifact['scope'];
  readonly size: number;
  readonly restore: RestoreTarget;
}

function toPosix(p: string): string {
  return p.split(sep).join('/');
}

function isUnder(child: string, parent: string): boolean {
  const c = resolve(child);
  const p = resolve(parent);
  return c === p || c.startsWith(p.endsWith(sep) ? p : p + sep);
}

function projectSlug(root: string): string {
  return `${slugify(basename(root)) || 'project'}-${sha256(resolve(root)).slice(0, 6)}`;
}

function categoryRelativeUser(p: string, claudeHome: string, kind: ArtifactKind): string {
  const sub = KIND_SUBDIR[kind];
  if (sub) {
    const root = join(claudeHome, sub);
    if (isUnder(p, root)) return toPosix(relative(root, p));
  }
  return basename(p);
}

function categoryRelativeProject(p: string, projectRoot: string, kind: ArtifactKind): string {
  const sub = KIND_SUBDIR[kind];
  if (sub) {
    const root = join(projectRoot, '.claude', sub);
    if (isUnder(p, root)) return toPosix(relative(root, p));
  }
  return toPosix(relative(projectRoot, p));
}

/**
 * Plan a single artifact: choose an archive path (category-organized and
 * unique) plus a portable restore target so it can be replaced on any machine.
 */
export function planFile(artifact: ScannedArtifact, ctx: PlanContext = {}): PlannedFile {
  const home = ctx.home ?? homedir();
  const claudeHome = join(home, '.claude');
  const category = categoryDirForKind(artifact.kind);
  const p = artifact.path;

  const projectRefs: ProjectRootRef[] = (ctx.projectRoots ?? []).map((root) => ({
    root,
    slug: projectSlug(root),
  }));
  const project = projectRefs
    .filter((ref) => isUnder(p, ref.root))
    .sort((a, b) => b.root.length - a.root.length)[0];

  let archivePath: string;
  let restore: RestoreTarget;

  if (project) {
    const categoryRel = categoryRelativeProject(p, project.root, artifact.kind);
    archivePath = `${category}/project-${project.slug}/${categoryRel}`;
    restore = {
      base: 'project',
      relative: toPosix(relative(project.root, p)),
      projectSlug: project.slug,
      projectRoot: project.root,
    };
  } else if (isUnder(p, home)) {
    const categoryRel = categoryRelativeUser(p, claudeHome, artifact.kind);
    archivePath = `${category}/${categoryRel}`;
    restore = { base: 'home', relative: toPosix(relative(home, p)) };
  } else {
    archivePath = `${category}/external/${basename(p)}`;
    restore = { base: 'absolute', relative: toPosix(isAbsolute(p) ? p : resolve(p)) };
  }

  return {
    sourcePath: p,
    archivePath,
    kind: artifact.kind,
    scope: artifact.scope,
    size: artifact.size,
    restore,
  };
}

/** Plan a list of artifacts, guaranteeing unique archive paths. */
export function planArtifacts(
  artifacts: readonly ScannedArtifact[],
  ctx: PlanContext = {},
): PlannedFile[] {
  const used = new Set<string>();
  const planned: PlannedFile[] = [];
  for (const artifact of artifacts) {
    const file = planFile(artifact, ctx);
    let archivePath = file.archivePath;
    if (used.has(archivePath)) {
      const suffix = sha256(file.sourcePath).slice(0, 6);
      const dot = archivePath.lastIndexOf('.');
      archivePath =
        dot > archivePath.lastIndexOf('/')
          ? `${archivePath.slice(0, dot)}.${suffix}${archivePath.slice(dot)}`
          : `${archivePath}.${suffix}`;
    }
    used.add(archivePath);
    planned.push({ ...file, archivePath });
  }
  return planned;
}
