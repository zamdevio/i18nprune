export {
  computeCacheContentHash,
  computeCacheProjectId,
  defaultProjectFilesState,
  defaultProjectsIndex,
  loadProjectFilesState,
  loadProjectRunState,
  loadProjectsIndex,
  maybeHealCacheIndex,
  normalizeProjectRootKey,
  nowIso,
  readJsonFileWithLimit,
  saveProjectFilesState,
  saveProjectRunState,
  saveProjectsIndex,
  textByteLength,
  touchProjectIndex,
  writeJsonAtomic,
} from './io/index.js';
export {
  initializeCacheState,
  isProjectCacheWritable,
  loadProjectRunEnvelope,
  prepareCacheForRun,
  resolveAnalysisCachePath,
  resolveCacheState,
  tryDeleteCacheFile,
  validateProjectFilesPayload,
  validateProjectRunEnvelope,
} from './setup/index.js';
export { diffProjectFiles, computeInputFilesEpoch } from './engine.js';
export { invalidateProjectAnalysisCache } from './invalidate.js';
export { layoutMatches, resolveCachedLocalesLayout } from './localesLayout.js';
export {
  buildLocaleSegmentRecords,
  buildSrcFileRecords,
  buildTrackedProjectFilesCurrent,
  mergeTrackedFileMaps,
  omitSyntheticSourceKey,
} from './trackedFiles.js';
export { classifyCacheFileDelta, countSrcDeltaAffected, srcDeltaIsEmpty } from './deltaClassify.js';
export { resolveFilesIndexStatus } from './filesIndexStatus.js';
export {
  resolveCacheConfig,
  resolveCacheRebuildConfig,
} from './resolveConfig.js';
export type { CacheConfigSource, ResolvedCacheConfig } from './resolveConfig.js';
export { decideAnalysisRebuild } from './rebuildPolicy.js';
export { getOrBuildCachedProjectData } from './dispatch.js';
export { emitCacheDispatchMessages, emitCacheMemoryHitMessage } from './events.js';
export {
  ANALYSIS_BASENAME,
  CACHE_PROFILE_DEFAULTS,
  CACHE_SCHEMA_VERSION,
  DEFAULT_CACHE_PROFILE_ID,
  MAX_ANALYSIS_BYTES,
  MAX_PROJECT_FILES_BYTES,
  MAX_PROJECTS_INDEX_BYTES,
} from '../shared/constants/cache.js';
export type {
  CachedLocalesLayout,
  CachedProjectInput,
  CacheDisableReason,
  CacheDispatchInfo,
  CacheDispatchPaths,
  CacheDispatchReason,
  CacheDispatchResult,
  CacheDispatchStatus,
  CacheFileDelta,
  CacheProducerContext,
  CacheRebuildConfig,
  CacheRebuildMode,
  CacheProfileId,
  CacheProfileDefaults,
  ClassifiedCacheFileDelta,
  ClassifiedSrcDelta,
  AnalysisRebuildDecision,
  AnalysisRebuildReason,
  AnalysisRebuildStrategy,
  FilesIndexStatus,
  CacheHashText,
  CacheInputFilesEpochDebug,
  CacheProjectFileRecord,
  CacheProjectFilesState,
  CacheProjectRunState,
  CacheProjectsIndex,
  CacheRuntime,
  CacheState,
  CacheStateInput,
  CacheWarning,
} from '../types/cache/index.js';
export { filesIndexIsUsable } from '../types/cache/filesIndex.js';
