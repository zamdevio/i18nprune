export { computeCacheContentHash, computeCacheProjectId } from './hash.js';
export { initializeCacheState, resolveCacheState } from './paths.js';
export {
  MAX_PROJECT_FILES_BYTES,
  MAX_PROJECT_RUN_BYTES,
  MAX_PROJECTS_INDEX_BYTES,
  nowIso,
  readJsonFileWithLimit,
  writeJsonAtomic,
} from './helpers.js';
export { diffProjectFiles, mergeProjectFilesState } from './engine.js';
export {
  defaultProjectsIndex,
  loadProjectsIndex,
  maybeHealCacheIndex,
  normalizeProjectRootKey,
  saveProjectsIndex,
  touchProjectIndex,
} from './projects.js';
export {
  defaultProjectFilesState,
  loadProjectFilesState,
  loadProjectRunState,
  saveProjectFilesState,
  saveProjectRunState,
} from './state.js';
export { prepareCacheForRun } from './maintenance.js';
export { getOrBuildCachedProjectData } from './dispatch.js';
export { emitCacheDispatchMessages, emitCacheMemoryHitMessage } from './events.js';
export type {
  CachedProjectInput,
  CacheDisableReason,
  CacheDispatchInfo,
  CacheDispatchPaths,
  CacheDispatchReason,
  CacheDispatchResult,
  CacheDispatchStatus,
  CacheFileDelta,
  CacheHashText,
  CacheProjectFileRecord,
  CacheProjectFilesState,
  CacheProjectRunState,
  CacheProjectsIndex,
  CacheRuntime,
  CacheState,
  CacheStateInput,
  CacheWarning,
} from '../types/cache/index.js';
export { CACHE_SCHEMA_VERSION } from '../types/cache/index.js';
