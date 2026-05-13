import type { CacheFileDelta, CacheHashText, CacheProjectFileRecord } from '../types/cache/index.js';
import { computeCacheContentHash } from './io/index.js';

/** Stable digest of the whole tracked-file map (paths + content hashes + sizes). */
export function computeInputFilesEpoch(
  files: Record<string, CacheProjectFileRecord>,
  hashText?: CacheHashText,
): string {
  const keys = Object.keys(files).sort();
  const canonical = keys.map((k) => {
    const r = files[k]!;
    return `${k}\t${r.hash}\t${String(r.size)}\n`;
  }).join('');
  return computeCacheContentHash(canonical, hashText);
}

/**
 * Computes file-level delta between a baseline and the current scan.
 *
 * Keys in `current` but not `previous` → added; keys with changed hash/size/mtime → changed;
 * keys in `previous` but not `current` → deleted; everything else → unchanged.
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
