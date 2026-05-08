export type * from '@/types/shared/cache/index.js';
export { CACHE_SCHEMA_VERSION } from '@/types/shared/cache/index.js';
export { computeProjectId, computeContentHash } from './hash.js';
export { initializeCliCacheState, resolveCliCacheState } from './paths.js';
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
export { diffProjectFiles, mergeProjectFilesState } from './engine.js';
export { getOrBuildProjectReportWithCache } from './dispatch.js';
export { prepareCacheForRun } from './maintenance.js';
export { resolveProjectReportData, refreshProjectReportCache } from './reportData.js';
export {
  resolveCachedProjectReportDocument,
  resolveLocalesDynamicSites,
  resolveDynamicSitesCount,
  resolveMissingResolvedKeys,
  resolveQualityData,
  resolveReviewData,
  resolveValidateData,
} from './resolve.js';
