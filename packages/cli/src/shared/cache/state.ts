import {
  CACHE_SCHEMA_VERSION,
  type CacheProjectFilesState,
  type CacheProjectRunState,
  type CliCacheState,
  type CliCacheWarning,
} from '@/types/shared/cache/index.js';
import { MAX_PROJECT_FILES_BYTES, MAX_PROJECT_RUN_BYTES, nowIso, readJsonFileWithLimit, writeJsonAtomic } from './helpers.js';

export function defaultProjectFilesState(): CacheProjectFilesState {
  return { version: CACHE_SCHEMA_VERSION, updatedAt: nowIso(), files: {} };
}

export function loadProjectFilesState(state: CliCacheState): { files: CacheProjectFilesState; warnings: CliCacheWarning[] } {
  const warnings: CliCacheWarning[] = [];
  if (!state.enabled) return { files: defaultProjectFilesState(), warnings };
  const { data, warning } = readJsonFileWithLimit<CacheProjectFilesState>(state.filesPath, MAX_PROJECT_FILES_BYTES);
  if (warning) warnings.push(warning);
  if (!data || typeof data !== 'object' || typeof data.files !== 'object') {
    return { files: defaultProjectFilesState(), warnings };
  }
  return { files: data, warnings };
}

export function saveProjectFilesState(state: CliCacheState, files: CacheProjectFilesState): CliCacheWarning | undefined {
  if (!state.enabled) return undefined;
  return writeJsonAtomic(state.filesPath, { ...files, updatedAt: nowIso(), version: CACHE_SCHEMA_VERSION });
}

export function loadProjectRunState(state: CliCacheState): { run?: CacheProjectRunState; warnings: CliCacheWarning[] } {
  const warnings: CliCacheWarning[] = [];
  if (!state.enabled) return { warnings };
  const { data, warning } = readJsonFileWithLimit<CacheProjectRunState>(state.runPath, MAX_PROJECT_RUN_BYTES);
  if (warning) warnings.push(warning);
  if (!data || typeof data !== 'object') return { warnings };
  return { run: data, warnings };
}

export function saveProjectRunState(
  state: CliCacheState,
  input: { data: unknown },
): CliCacheWarning | undefined {
  if (!state.enabled) return undefined;
  const payload: CacheProjectRunState = {
    version: CACHE_SCHEMA_VERSION,
    updatedAt: nowIso(),
    projectId: state.projectId,
    data: input.data,
  };
  return writeJsonAtomic(state.runPath, payload);
}
