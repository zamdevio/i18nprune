import type { CacheFileDelta } from './index.js';
import type { FilesIndexStatus } from './filesIndex.js';

export type CacheRebuildMode = 'partial' | 'full';

export type AnalysisRebuildStrategy = 'full' | 'partial' | 'reuse';

export type CacheRebuildConfig = {
  rebuild: CacheRebuildMode;
  fullRescanThresholdPercent: number;
};

export type ClassifiedSrcDelta = {
  added: string[];
  changed: string[];
  deleted: string[];
};

export type ClassifiedCacheFileDelta = {
  src: ClassifiedSrcDelta;
  sourceLocale: string[];
  targetLocale: string[];
  layoutChanged: boolean;
  filesIndexStatus: FilesIndexStatus;
};

export type AnalysisRebuildReason =
  | 'config_rebuild_full'
  | 'layout_changed'
  | 'source_locale_changed'
  | 'source_locale_partial'
  | 'target_locale_only'
  | 'locale_or_non_src_changed'
  | 'no_previous_cache'
  | 'src_threshold'
  | 'src_partial'
  | 'files_index_missing'
  | 'files_index_malformed'
  | 'files_index_empty'
  | 'files_index_stale'
  | 'files_index_recovered';

export type AnalysisRebuildDecision = {
  strategy: AnalysisRebuildStrategy;
  reason: AnalysisRebuildReason;
  thresholdPercent?: number;
  srcAffected?: number;
  trackedSrcCount?: number;
  /** Present on miss when src bucket was classified (debug-cache detail). */
  srcDelta?: ClassifiedSrcDelta;
};

/** Context passed to `CachedProjectInput.producer` on cache miss. */
export type CacheProducerContext<T> = {
  delta: CacheFileDelta;
  classified: ClassifiedCacheFileDelta;
  previous?: T;
  trackedSrcCount: number;
  rebuildConfig: CacheRebuildConfig;
  analysisRebuild?: AnalysisRebuildDecision;
};
