import type { CacheFileDelta, CacheProjectFileRecord } from '@/types/shared/cache/index.js';

/**
 * Computes file-level delta against cached records. `current` should be keyed by stable
 * display/relative path used by the scanner pipeline.
 */
export function diffProjectFiles(
  previous: Record<string, CacheProjectFileRecord>,
  current: Record<string, CacheProjectFileRecord>,
): CacheFileDelta {
  const added: string[] = [];
  const changed: string[] = [];
  const deleted: string[] = [];
  const unchanged: string[] = [];

  for (const [k, next] of Object.entries(current)) {
    const prev = previous[k];
    if (!prev) {
      added.push(k);
      continue;
    }
    if (prev.hash !== next.hash || prev.size !== next.size || prev.mtimeMs !== next.mtimeMs) {
      changed.push(k);
    } else {
      unchanged.push(k);
    }
  }

  for (const k of Object.keys(previous)) {
    if (!(k in current)) deleted.push(k);
  }

  return { added, changed, deleted, unchanged };
}

/** Apply changed/new records and prune deleted ones. */
export function mergeProjectFilesState(
  previous: Record<string, CacheProjectFileRecord>,
  current: Record<string, CacheProjectFileRecord>,
  delta: CacheFileDelta,
): Record<string, CacheProjectFileRecord> {
  const next: Record<string, CacheProjectFileRecord> = { ...previous };
  for (const k of delta.deleted) delete next[k];
  for (const k of [...delta.added, ...delta.changed]) {
    const rec = current[k];
    if (rec) next[k] = rec;
  }
  return next;
}
