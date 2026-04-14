import type { I18nPruneConfig } from '@/types/config/index.js';
import type { RunOptions } from '@/types/core/runtime/index.js';

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
  warnings: string[];
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
};

export type CliGlobalOverrides = {
  source?: string;
  localesDir?: string;
  src?: string;
  functions?: string;
  noDiscovery?: boolean;
};
