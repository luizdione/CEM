import type { ArtifactKind } from '@cem/shared';
import type { ArtifactScope, ScannedArtifact } from '@cem/core';

/** Group artifacts by their kind. */
export function groupByKind(
  artifacts: readonly ScannedArtifact[],
): Partial<Record<ArtifactKind, ScannedArtifact[]>> {
  const groups: Partial<Record<ArtifactKind, ScannedArtifact[]>> = {};
  for (const artifact of artifacts) {
    (groups[artifact.kind] ??= []).push(artifact);
  }
  return groups;
}

/** Count artifacts per kind. */
export function countByKind(artifacts: readonly ScannedArtifact[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const artifact of artifacts) {
    counts[artifact.kind] = (counts[artifact.kind] ?? 0) + 1;
  }
  return counts;
}

/** Sum of estimated tokens across artifacts. */
export function totalTokens(artifacts: readonly ScannedArtifact[]): number {
  return artifacts.reduce((sum, a) => sum + (a.tokens ?? 0), 0);
}

/** Sum of byte sizes across artifacts. */
export function totalBytes(artifacts: readonly ScannedArtifact[]): number {
  return artifacts.reduce((sum, a) => sum + a.size, 0);
}

export interface ArtifactFilter {
  readonly kinds?: readonly ArtifactKind[];
  readonly scopes?: readonly ArtifactScope[];
  /** Case-insensitive substring match against name or path. */
  readonly search?: string;
  readonly sensitiveOnly?: boolean;
}

/** Filter artifacts by kind, scope, search text and sensitivity. */
export function filterArtifacts(
  artifacts: readonly ScannedArtifact[],
  filter: ArtifactFilter,
): ScannedArtifact[] {
  const search = filter.search?.toLowerCase();
  return artifacts.filter((a) => {
    if (filter.kinds && !filter.kinds.includes(a.kind)) return false;
    if (filter.scopes && !filter.scopes.includes(a.scope)) return false;
    if (filter.sensitiveOnly && !a.sensitive) return false;
    if (search && !a.name.toLowerCase().includes(search) && !a.path.toLowerCase().includes(search)) {
      return false;
    }
    return true;
  });
}
