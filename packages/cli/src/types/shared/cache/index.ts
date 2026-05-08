export const CACHE_SCHEMA_VERSION = 1 as const;

export type CliCacheDisableReason =
  | 'default'
  | 'cli_no_cache'
  | 'project_root_missing'
  | 'cache_dir_unavailable'
  | 'cache_io_error'
  | 'cache_oversize'
  | 'cache_malformed';

export type CliCacheState = {
  enabled: boolean;
  reason: CliCacheDisableReason;
  rootDir: string;
  metaPath: string;
  projectId: string;
  projectRoot: string;
  projectDir: string;
  filesPath: string;
  runPath: string;
};

export type CliCacheWarning = {
  code: CliCacheDisableReason;
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
