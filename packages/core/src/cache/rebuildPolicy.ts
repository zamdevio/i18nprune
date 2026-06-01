import { countSrcDeltaAffected, srcDeltaIsEmpty } from './deltaClassify.js';
import { filesIndexIsUsable } from '../types/cache/filesIndex.js';
import type {
  AnalysisRebuildDecision,
  AnalysisRebuildReason,
  CacheRebuildConfig,
  ClassifiedCacheFileDelta,
  FilesIndexStatus,
} from '../types/cache/index.js';

function filesIndexRebuildReason(status: FilesIndexStatus): AnalysisRebuildReason {
  switch (status.kind) {
    case 'missing':
      return 'files_index_missing';
    case 'malformed':
      return 'files_index_malformed';
    case 'empty':
      return 'files_index_empty';
    default:
      return 'files_index_missing';
  }
}

/** Decide whether to patch src scan arrays, reuse analysis, or run a full `scanProjectAnalysis`. */
export function decideAnalysisRebuild(input: {
  config: CacheRebuildConfig;
  classified: ClassifiedCacheFileDelta;
  hasPrevious: boolean;
  trackedSrcCount: number;
}): AnalysisRebuildDecision {
  if (input.config.rebuild === 'full') {
    return { strategy: 'full', reason: 'config_rebuild_full' };
  }
  if (!input.hasPrevious) {
    if (!filesIndexIsUsable(input.classified.filesIndexStatus)) {
      return { strategy: 'full', reason: filesIndexRebuildReason(input.classified.filesIndexStatus) };
    }
    return { strategy: 'full', reason: 'no_previous_cache' };
  }
  if (!filesIndexIsUsable(input.classified.filesIndexStatus)) {
    return { strategy: 'full', reason: 'files_index_stale' };
  }
  if (input.classified.layoutChanged) {
    return { strategy: 'full', reason: 'layout_changed' };
  }
  if (input.classified.sourceLocale.length > 0) {
    const sourceOnly =
      input.classified.targetLocale.length === 0 && srcDeltaIsEmpty(input.classified.src);
    if (sourceOnly) {
      return { strategy: 'partial', reason: 'source_locale_partial' };
    }
    return { strategy: 'full', reason: 'source_locale_changed' };
  }
  if (
    input.classified.targetLocale.length > 0 &&
    srcDeltaIsEmpty(input.classified.src)
  ) {
    return { strategy: 'reuse', reason: 'target_locale_only' };
  }
  if (srcDeltaIsEmpty(input.classified.src)) {
    return { strategy: 'full', reason: 'locale_or_non_src_changed' };
  }

  const srcAffected = countSrcDeltaAffected(input.classified.src);
  const trackedSrcCount = input.trackedSrcCount;
  const threshold = input.config.fullRescanThresholdPercent;
  const percent = trackedSrcCount > 0 ? (srcAffected / trackedSrcCount) * 100 : 100;
  if (percent >= threshold) {
    return {
      strategy: 'full',
      reason: 'src_threshold',
      thresholdPercent: threshold,
      srcAffected,
      trackedSrcCount,
    };
  }

  return {
    strategy: 'partial',
    reason: 'src_partial',
    srcAffected,
    trackedSrcCount,
  };
}
