import type { RuntimeFsPort, RuntimePathPort, RuntimeSystemPort } from '../runtime/index.js';
import type { ScanExcludeConfig } from '../scanner/index.js';

/** Why the cache was disabled for this run (or `'default'` when enabled normally). */
export type CacheDisableReason =
  | 'default'
  | 'cli_no_cache'
  | 'config_disabled'
  | 'project_root_missing'
  | 'cache_dir_unavailable'
  | 'cache_io_error'
  | 'cache_oversize'
  | 'cache_malformed'
  | 'cache_read_only';

/** Resolved cache paths and flags for the current run, produced by `initializeCacheState`. */
export type CacheState = {
  enabled: boolean;
  reason: CacheDisableReason;
  rootDir: string;
  metaPath: string;
  projectId: string;
  projectRoot: string;
  projectDir: string;
  filesPath: string;
  /** Project report / snapshot payload (`snapshot.json`). */
  snapshotPath: string;
  /** Key-site + dynamic scan payload (`analysis.json`). */
  analysisPath: string;
  /** When true, cache reads are allowed but project cache files are not written. */
  readOnly: boolean;
};

/** Non-fatal diagnostic emitted when a cache file is corrupt, oversized, or inaccessible. */
export type CacheWarning = {
  code: CacheDisableReason;
  message: string;
  path?: string;
};

export type CacheProjectsIndex = {
  version: number;
  updatedAt: string;
  projects: Record<string, string>;
  maintenance: {
    runCount: number;
    healEveryRuns: number;
    lastHealAt?: string;
  };
};

/** Per-file hash/size/mtime record stored in `files.json`. */
export type CacheProjectFileRecord = {
  hash: string;
  size: number;
  mtimeMs: number;
  updatedAt: string;
};

export type CacheProjectFilesState = {
  version: number;
  updatedAt: string;
  files: Record<string, CacheProjectFileRecord>;
};

export type CacheProjectRunState = {
  version: number;
  updatedAt: string;
  projectId: string;
  data: unknown;
  /**
   * Digest of the tracked `files.json` map when `data` was produced. Compared on cache hit so a
   * sibling cache writer (e.g. project-analysis) cannot leave `snapshot.json` bound to an older index.
   */
  inputFilesEpoch?: string;
};

export type CacheDispatchStatus = 'hit' | 'miss' | 'bypass' | 'disabled';

export type CacheDispatchReason =
  | 'cache_hit'
  | 'no_cache'
  | 'cache_unavailable'
  | 'run_missing'
  | 'files_changed'
  // snapshot envelope exists but inputFilesEpoch !== current digest (e.g. sibling cache refreshed files.json)
  | 'run_binding_stale'
  | 'producer_succeeded'
  | 'run_invalid';

/** File-level diff between a baseline and the current scan, used for `--debug-cache` output. */
export type CacheFileDelta = {
  added: string[];
  changed: string[];
  deleted: string[];
  unchanged: string[];
};

export type CacheHashText = (text: string) => string;

/** Host-injected IO adapters and utilities used by all cache operations. */
export type CacheRuntime = {
  fs: RuntimeFsPort;
  path: RuntimePathPort;
  system: RuntimeSystemPort;
  hashText?: CacheHashText;
  byteLength?: (text: string) => number;
  fileSize?: (filePath: string) => number | undefined;
  writeTextAtomic?: (filePath: string, content: string) => void;
  deleteDir?: (dirPath: string) => void;
};

export type CacheStateInput = {
  projectRoot: string;
  cacheRootDir: string;
  noCache?: boolean;
  disabledReason?: CacheDisableReason;
  runtime: CacheRuntime;
  /** When true, treat cache as read-through: no writes to project cache files. */
  cacheReadOnly?: boolean;
};

export type CacheDispatchPaths = {
  meta: string;
  files: string;
  snapshot: string;
  analysis: string;
  projectDir: string;
};

/** When a miss is due to `run_binding_stale`, surfaces what `--debug-cache` should compare. */
export type CacheInputFilesEpochDebug = {
  cached?: string;
  current: string;
};

/** Result metadata from a single cache dispatch (hit/miss, reason, delta, warnings). */
export type CacheDispatchInfo = {
  status: CacheDispatchStatus;
  reason: CacheDispatchReason;
  warnings: CacheWarning[];
  delta?: CacheFileDelta;
  paths?: CacheDispatchPaths;
  inputFilesEpochDebug?: CacheInputFilesEpochDebug;
};

export type CacheDispatchResult<T> = {
  data: T;
  cache: CacheDispatchInfo;
};

/** Input bag for `getOrBuildCachedProjectData` — describes what to cache and how to validate it. */
export type CachedProjectInput<T> = {
  state: CacheState;
  runtime: CacheRuntime;
  /**
   * Optional cache slot. Omit for the default **snapshot** slot (`snapshot.json`). Use **`"analysis"`**
   * for the scan payload (`analysis.json`). Any other key is sanitized and stored as a sibling JSON file.
   */
  cacheKey?: string;
  sourceLocalePath: string;
  srcRoot: string;
  exclude?: ScanExcludeConfig;
  producer: () => T;
  parseCachedData?: (data: unknown) => { ok: true; data: T } | { ok: false };
  /**
   * Pre-loaded `files.json` baseline from before any dispatch in this run. When provided, the
   * delta is computed against these records so sibling cache writes don't mask real file changes.
   */
  baselineFiles?: Record<string, CacheProjectFileRecord>;
};
