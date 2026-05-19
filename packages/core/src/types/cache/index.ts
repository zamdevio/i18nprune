import type { LocalesFilesystemConfig } from '../../config/schema/root.js';
import type { LocalesLayoutMode, LocalesLayoutStructure } from '../locales/layout.js';
import type { RuntimeFsPort, RuntimePathPort, RuntimeSystemPort } from '../runtime/index.js';
import type { ScanExcludeConfig } from '../scanner/index.js';
import type { AnalysisRebuildDecision, CacheProducerContext, CacheRebuildConfig } from './rebuild.js';
import type { CacheFileDelta } from './delta.js';
import type { FilesIndexStatus } from './filesIndex.js';

export type { CacheProfileDefaults, CacheProfileId } from './profile.js';
export type { CacheConfigSource, ResolvedCacheConfig } from './resolve.js';
export type { CacheFileDelta } from './delta.js';
export type { FilesIndexStatus } from './filesIndex.js';
export { filesIndexIsUsable } from './filesIndex.js';
export type {
  AnalysisRebuildDecision,
  AnalysisRebuildReason,
  AnalysisRebuildStrategy,
  CacheProducerContext,
  CacheRebuildConfig,
  CacheRebuildMode,
  ClassifiedCacheFileDelta,
  ClassifiedSrcDelta,
} from './rebuild.js';
export type {
  AnalysisCacheInvalidationAction,
  AnalysisCacheInvalidationDecision,
  AnalysisCacheInvalidationReason,
  LocaleWriteInvalidationInput,
} from './invalidation.js';

/** Layout fingerprint stored in `files.json` (`mode` + `structure` + config paths). */
export type CachedLocalesLayout = {
  mode: LocalesLayoutMode;
  structure: LocalesLayoutStructure;
  directory: string;
  source: string;
};

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
  /** Project scan payload (`analysis.json`). */
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
  /** Bundle-relative locale segment paths allowed by `localesLayout`. */
  localeSegments?: Record<string, CacheProjectFileRecord>;
  localesLayout?: CachedLocalesLayout;
};

export type CacheProjectRunState = {
  version: number;
  updatedAt: string;
  projectId: string;
  data: unknown;
  /**
   * Digest of the tracked `files.json` map when `data` was produced. Compared on cache hit so an
   * older `analysis.json` cannot serve after `files.json` was refreshed.
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
  | 'files_index_recovered'
  | 'run_binding_stale'
  | 'producer_succeeded'
  | 'run_invalid';

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
  /** Set when analysis was rebuilt on miss (`--debug-cache` surfaces strategy). */
  analysisRebuild?: AnalysisRebuildDecision;
  /** Set when `files.json` was missing, malformed, or empty on load. */
  filesIndexStatus?: FilesIndexStatus;
};

export type CacheDispatchResult<T> = {
  data: T;
  cache: CacheDispatchInfo;
};

/** Input bag for `getOrBuildCachedProjectData` — describes what to cache and how to validate it. */
export type CachedProjectInput<T> = {
  state: CacheState;
  runtime: CacheRuntime;
  sourceLocalePath: string;
  srcRoot: string;
  localesDir: string;
  locales: LocalesFilesystemConfig;
  exclude?: ScanExcludeConfig;
  producer: (ctx?: CacheProducerContext<T>) => T;
  parseCachedData?: (data: unknown) => { ok: true; data: T } | { ok: false };
  rebuildConfig?: CacheRebuildConfig;
  /**
   * Pre-loaded `files.json` baseline from before any dispatch in this run. When provided, the
   * delta is computed against these records so writes during the run do not mask real file changes.
   */
  baselineFiles?: Record<string, CacheProjectFileRecord>;
};
