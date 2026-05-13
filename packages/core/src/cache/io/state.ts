import { CACHE_SCHEMA_VERSION, MAX_PROJECT_FILES_BYTES } from '../../shared/constants/cache.js';
import type {
  CacheProjectFilesState,
  CacheProjectRunState,
  CacheRuntime,
  CacheState,
  CacheWarning,
} from '../../types/cache/index.js';
import { nowIso, readJsonFileWithLimit, writeJsonAtomic } from './helpers.js';
import {
  cacheSlotReadPaths,
  isProjectCacheWritable,
  loadProjectRunEnvelopeFromCandidates,
  resolveCacheSlotPath,
  validateProjectFilesPayload,
} from '../setup/policy.js';

/** Empty files-state baseline used when no `files.json` exists on disk yet. */
export function defaultProjectFilesState(runtime?: Pick<CacheRuntime, 'system'>): CacheProjectFilesState {
  return { version: CACHE_SCHEMA_VERSION, updatedAt: nowIso(runtime), files: {} };
}

/**
 * Loads and validates the project `files.json` index.
 *
 * Returns a default empty state (with diagnostic warnings) when the file is missing,
 * oversized, malformed, or fails schema validation — never throws.
 */
export function loadProjectFilesState(
  state: CacheState,
  runtime: CacheRuntime,
): { files: CacheProjectFilesState; warnings: CacheWarning[] } {
  const warnings: CacheWarning[] = [];
  if (!state.enabled) return { files: defaultProjectFilesState(runtime), warnings };
  const { data, warning } = readJsonFileWithLimit<unknown>(state.filesPath, MAX_PROJECT_FILES_BYTES, runtime);
  if (warning) warnings.push(warning);
  if (data === undefined) {
    return { files: defaultProjectFilesState(runtime), warnings };
  }
  const validated = validateProjectFilesPayload(data, state.filesPath);
  if (!validated.ok) {
    warnings.push({
      code: 'cache_malformed',
      message: `cache files index invalid (${validated.message})`,
      path: state.filesPath,
    });
    return { files: defaultProjectFilesState(runtime), warnings };
  }
  return { files: validated.files, warnings };
}

/** Persists the project files index; returns a warning instead of throwing on IO errors. */
export function saveProjectFilesState(
  state: CacheState,
  files: CacheProjectFilesState,
  runtime: CacheRuntime,
): CacheWarning | undefined {
  if (!state.enabled) return undefined;
  if (!isProjectCacheWritable(state)) {
    return {
      code: 'cache_read_only',
      message: 'cache is read-only; skipped persisting files index',
      path: state.filesPath,
    };
  }
  return writeJsonAtomic(state.filesPath, { ...files, updatedAt: nowIso(runtime), version: CACHE_SCHEMA_VERSION }, runtime);
}

/**
 * Loads the run envelope (snapshot or analysis payload) for a cache slot.
 *
 * Tries canonical then legacy file names via `cacheSlotReadPaths`; validates
 * the envelope shape so corrupt JSON does not propagate to consumers.
 */
export function loadProjectRunState(
  state: CacheState,
  runtime: CacheRuntime,
  cacheKey?: string,
): { run?: CacheProjectRunState; warnings: CacheWarning[] } {
  if (!state.enabled) return { warnings: [] };
  const paths = cacheSlotReadPaths(state, runtime, cacheKey);
  return loadProjectRunEnvelopeFromCandidates(paths, runtime);
}

/** Persists a run envelope to the appropriate cache slot; returns a warning instead of throwing. */
export function saveProjectRunState(
  state: CacheState,
  runtime: CacheRuntime,
  cacheKey: string | undefined,
  input: { data: unknown; inputFilesEpoch?: string },
): CacheWarning | undefined {
  if (!state.enabled) return undefined;
  if (!isProjectCacheWritable(state)) {
    return {
      code: 'cache_read_only',
      message: 'cache is read-only; skipped persisting run envelope',
      path: resolveCacheSlotPath(state, runtime, cacheKey),
    };
  }
  const payload: CacheProjectRunState = {
    version: CACHE_SCHEMA_VERSION,
    updatedAt: nowIso(runtime),
    projectId: state.projectId,
    data: input.data,
    ...(input.inputFilesEpoch !== undefined ? { inputFilesEpoch: input.inputFilesEpoch } : {}),
  };
  const targetPath = resolveCacheSlotPath(state, runtime, cacheKey);
  return writeJsonAtomic(targetPath, payload, runtime);
}
