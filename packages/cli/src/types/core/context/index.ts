import type { I18nPruneConfig } from '@i18nprune/core/config';
import type { RunOptions } from '@i18nprune/core';
import type { CacheProjectFileRecord, CacheState } from '@i18nprune/core';
import type { RuntimeAdapters } from '@i18nprune/core';

export type ConfigLayer = 'default' | 'file' | 'env' | 'discovery' | 'cli';

/** Which layer last wrote a field (highest priority wins). */
export type FieldSources = {
  source?: ConfigLayer;
  localesDir?: ConfigLayer;
  src?: ConfigLayer;
  functions?: ConfigLayer;
  policies?: ConfigLayer;
};

/** Per-field provenance for debugging and verbose output. */
export type ContextMeta = {
  fieldSources: FieldSources;
  /** False when no `i18nprune.config.*` exists in cwd; merged config is built-in defaults plus env / discovery / CLI. */
  configFileLoaded: boolean;
  warnings: string[];
  cache: CacheState;
  /** Pre-loaded `files.json` snapshot from before any dispatch. Shared by all dispatches for accurate delta. */
  cacheBaselineFiles?: Record<string, CacheProjectFileRecord>;
};

export type ResolvedPaths = {
  sourceLocale: string;
  localesDir: string;
  srcRoot: string;
};

export type Context = {
  config: I18nPruneConfig;
  paths: ResolvedPaths;
  run: RunOptions;
  meta: ContextMeta;
  /** Node (default) or injected host adapters for core engines. */
  adapters: RuntimeAdapters;
};

export type CliGlobalOverrides = {
  source?: string;
  localesDir?: string;
  src?: string;
  functions?: string;
  noDiscovery?: boolean;
  /** Extra directory basenames to skip while scanning (from global `--exclude`, appended after config `exclude.dirs`). */
  scanExcludeDirNames?: string[];
  /** When set, forces `exclude.useDefaultSkip = false` from host-level overrides. */
  noDefaultScanSkip?: boolean;
  /** Per-run cache bypass (`--no-cache`). */
  noCache?: boolean;
  /** Per-run patching override (`--patch`) to force patching enabled regardless of config file default. */
  patch?: boolean;
};
