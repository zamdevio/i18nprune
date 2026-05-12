import { listSourceFiles } from '../shared/scanner/files.js';
import { readRuntimeFsTextSync } from '../runtime/helpers/sync/index.js';
import { computeCacheContentHash } from './hash.js';
import { diffProjectFiles } from './engine.js';
import { loadProjectFilesState, loadProjectRunState, saveProjectFilesState, saveProjectRunState } from './state.js';
import { prepareCacheForRun } from './maintenance.js';
import type {
  CacheDispatchResult,
  CacheProjectFileRecord,
  CachedProjectInput,
  CacheDispatchReason,
  CacheWarning,
} from '../types/cache/index.js';

function runPathForCacheKey<T>(input: CachedProjectInput<T>): string {
  if (input.cacheKey === undefined || input.cacheKey.trim() === '') return input.state.runPath;
  const safe = input.cacheKey.replace(/[^A-Za-z0-9._-]/g, '_');
  return input.runtime.path.join(input.state.projectDir, `${safe}.json`);
}

function byteLength(text: string, input: CachedProjectInput<unknown>): number {
  return input.runtime.byteLength ? input.runtime.byteLength(text) : new TextEncoder().encode(text).length;
}

function buildCurrentFileRecords<T>(input: CachedProjectInput<T>): Record<string, CacheProjectFileRecord> {
  const files = listSourceFiles(
    { fs: input.runtime.fs, path: input.runtime.path },
    input.srcRoot,
    input.exclude,
  );
  const all = [input.sourceLocalePath, ...files];
  const now = new Date(input.runtime.system.now()).toISOString();
  const out: Record<string, CacheProjectFileRecord> = {};
  for (const absPath of all) {
    const content = readRuntimeFsTextSync(absPath, input.runtime.fs);
    const rel = input.runtime.path.relative(input.srcRoot, absPath).replace(/\\/g, '/');
    const key = absPath === input.sourceLocalePath ? '__source_locale__' : rel;
    out[key] = {
      hash: computeCacheContentHash(content, input.runtime.hashText),
      size: byteLength(content, input),
      mtimeMs: 0,
      updatedAt: now,
    };
  }
  return out;
}

export function getOrBuildCachedProjectData<T>(input: CachedProjectInput<T>): CacheDispatchResult<T> {
  const warnings: CacheWarning[] = [];
  const state = input.state;
  const runPath = runPathForCacheKey(input);
  const paths = {
    meta: state.metaPath,
    files: state.filesPath,
    run: runPath,
    projectDir: state.projectDir,
  };
  if (!state.enabled) {
    return {
      data: input.producer(),
      cache: {
        status: state.reason === 'cli_no_cache' ? 'bypass' : 'disabled',
        reason: 'no_cache',
        warnings,
        paths,
      },
    };
  }

  const prepared = prepareCacheForRun(state, input.runtime);
  warnings.push(...prepared.warnings);

  const currentFiles = buildCurrentFileRecords(input);
  const prevFiles = loadProjectFilesState(state, input.runtime);
  warnings.push(...prevFiles.warnings);
  const delta = diffProjectFiles(prevFiles.files.files, currentFiles);
  const hasFileChanges = delta.added.length + delta.changed.length + delta.deleted.length > 0;

  const prevRun = loadProjectRunState({ ...state, runPath }, input.runtime);
  warnings.push(...prevRun.warnings);
  let missReason: CacheDispatchReason = hasFileChanges ? 'files_changed' : 'run_missing';
  if (!hasFileChanges && prevRun.run?.data !== undefined) {
    const parsed = input.parseCachedData
      ? input.parseCachedData(prevRun.run.data)
      : ({ ok: true, data: prevRun.run.data as T } as const);
    if (parsed.ok) {
      return {
        data: parsed.data,
        cache: {
          status: 'hit',
          reason: 'cache_hit',
          warnings,
          delta,
          paths,
        },
      };
    }
    missReason = 'run_invalid';
  }

  const fresh = input.producer();
  const saveFilesWarn = saveProjectFilesState(state, { ...prevFiles.files, files: currentFiles }, input.runtime);
  if (saveFilesWarn) warnings.push(saveFilesWarn);
  const saveRunWarn = saveProjectRunState({ ...state, runPath }, { data: fresh }, input.runtime);
  if (saveRunWarn) warnings.push(saveRunWarn);

  return {
    data: fresh,
    cache: {
      status: 'miss',
      reason: missReason,
      warnings,
      delta,
      paths,
    },
  };
}
