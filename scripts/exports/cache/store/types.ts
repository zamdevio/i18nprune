import type { InventorySnapshot, SnapshotScanDepth } from '../../inventory/index.js';

export interface CacheMetaEntry {
  requestedRefs: string[];
  generatedAt: string;
  summary: InventorySnapshot['summary'];
  commitDate?: string;
}

export interface CacheMeta {
  version: number;
  toolVersion: number;
  entries: Record<string, CacheMetaEntry>;
}

/** Which on-disk snapshot file set to use (isolates timeline from full scans). */
export type CacheProfile = 'full' | 'timeline';

export interface CacheOptions {
  noCache?: boolean;
  /** Skip cache read, rebuild, and overwrite on disk for this run (`-f` / `--force`). */
  force?: boolean;
  /** `timeline` uses a separate small cache file; default `full` for inventory/diff/graph/trend. */
  profile?: CacheProfile;
  /** Override scan depth; derived from profile when omitted. */
  depth?: SnapshotScanDepth;
  /** Pre-known git meta (timeline avoids per-commit `git show` for dates). */
  git?: InventorySnapshot['git'];
}

export type CacheStatus = 'hit' | 'miss' | 'refresh' | 'bypass' | 'n/a';

export interface SnapshotResult {
  snapshot: InventorySnapshot;
  cache: CacheStatus;
  barrelPath: string;
}
