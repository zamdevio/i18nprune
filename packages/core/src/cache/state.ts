import {
  CACHE_SCHEMA_VERSION,
  type CacheProjectFilesState,
  type CacheProjectRunState,
  type CacheRuntime,
  type CacheState,
  type CacheWarning,
} from '../types/cache/index.js';
import { MAX_PROJECT_FILES_BYTES, MAX_PROJECT_RUN_BYTES, nowIso, readJsonFileWithLimit, writeJsonAtomic } from './helpers.js';

export function defaultProjectFilesState(runtime?: Pick<CacheRuntime, 'system'>): CacheProjectFilesState {
  return { version: CACHE_SCHEMA_VERSION, updatedAt: nowIso(runtime), files: {} };
}

export function loadProjectFilesState(
  state: CacheState,
  runtime: CacheRuntime,
): { files: CacheProjectFilesState; warnings: CacheWarning[] } {
  const warnings: CacheWarning[] = [];
  if (!state.enabled) return { files: defaultProjectFilesState(runtime), warnings };
  const { data, warning } = readJsonFileWithLimit<CacheProjectFilesState>(state.filesPath, MAX_PROJECT_FILES_BYTES, runtime);
  if (warning) warnings.push(warning);
  if (!data || typeof data !== 'object' || typeof data.files !== 'object') {
    return { files: defaultProjectFilesState(runtime), warnings };
  }
  return { files: data, warnings };
}

export function saveProjectFilesState(
  state: CacheState,
  files: CacheProjectFilesState,
  runtime: CacheRuntime,
): CacheWarning | undefined {
  if (!state.enabled) return undefined;
  return writeJsonAtomic(state.filesPath, { ...files, updatedAt: nowIso(runtime), version: CACHE_SCHEMA_VERSION }, runtime);
}

export function loadProjectRunState(
  state: CacheState,
  runtime: CacheRuntime,
): { run?: CacheProjectRunState; warnings: CacheWarning[] } {
  const warnings: CacheWarning[] = [];
  if (!state.enabled) return { warnings };
  const { data, warning } = readJsonFileWithLimit<CacheProjectRunState>(state.runPath, MAX_PROJECT_RUN_BYTES, runtime);
  if (warning) warnings.push(warning);
  if (!data || typeof data !== 'object') return { warnings };
  return { run: data, warnings };
}

export function saveProjectRunState(
  state: CacheState,
  input: { data: unknown },
  runtime: CacheRuntime,
): CacheWarning | undefined {
  if (!state.enabled) return undefined;
  const payload: CacheProjectRunState = {
    version: CACHE_SCHEMA_VERSION,
    updatedAt: nowIso(runtime),
    projectId: state.projectId,
    data: input.data,
  };
  return writeJsonAtomic(state.runPath, payload, runtime);
}
