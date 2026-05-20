import type { ScanExcludeConfig } from '../scanner/exclude.js';

/** Normalized i18n config extracted from an uploaded project archive. */
export type NormalizedProjectConfig = {
  source: string;
  src: string;
  localesDir: string;
  localesMode?: 'flat_file' | 'locale_directory';
  localesStructure?: 'locale_file' | 'locale_per_dir' | 'feature_bundle';
  functions: string[];
  exclude?: ScanExcludeConfig;
};

/** Optional config overrides on worker project routes (validate, review, missing, report). */
export type ProjectWorkerConfigBody = {
  configJson?: Record<string, unknown> | string;
  config?: Record<string, unknown>;
  configOverrides?: Record<string, unknown>;
};
