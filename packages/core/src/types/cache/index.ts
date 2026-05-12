import type { RuntimeFsPort, RuntimePathPort, RuntimeSystemPort } from '../runtime/index.js';
import type { ScanExcludeConfig } from '../scanner/index.js';

export const CACHE_SCHEMA_VERSION = 1 as const;

export type CacheDisableReason =
  | 'default'
  | 'cli_no_cache'
  | 'config_disabled'
  | 'project_root_missing'
  | 'cache_dir_unavailable'
  | 'cache_io_error'
  | 'cache_oversize'
  | 'cache_malformed';

export type CacheState = {
  enabled: boolean;
  reason: CacheDisableReason;
  rootDir: string;
  metaPath: string;
  projectId: string;
  projectRoot: string;
  projectDir: string;
  filesPath: string;
  runPath: string;
};

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
};

export type CacheDispatchStatus = 'hit' | 'miss' | 'bypass' | 'disabled';

export type CacheDispatchReason =
  | 'cache_hit'
  | 'no_cache'
  | 'cache_unavailable'
  | 'run_missing'
  | 'files_changed'
  | 'producer_succeeded'
  | 'run_invalid';

export type CacheFileDelta = {
  added: string[];
  changed: string[];
  deleted: string[];
  unchanged: string[];
};

export type CacheHashText = (text: string) => string;

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
};

export type CacheDispatchPaths = {
  meta: string;
  files: string;
  run: string;
  projectDir: string;
};

export type CacheDispatchInfo = {
  status: CacheDispatchStatus;
  reason: CacheDispatchReason;
  warnings: CacheWarning[];
  delta?: CacheFileDelta;
  paths?: CacheDispatchPaths;
};

export type CacheDispatchResult<T> = {
  data: T;
  cache: CacheDispatchInfo;
};

export type CachedProjectInput<T> = {
  state: CacheState;
  runtime: CacheRuntime;
  /**
   * Optional per-dataset cache slot. Omit to keep the historical project `run.json` path.
   * Use this when multiple core-owned analyses share the same project file-diff state.
   */
  cacheKey?: string;
  sourceLocalePath: string;
  srcRoot: string;
  exclude?: ScanExcludeConfig;
  producer: () => T;
  parseCachedData?: (data: unknown) => { ok: true; data: T } | { ok: false };
};
