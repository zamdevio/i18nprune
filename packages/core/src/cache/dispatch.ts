import { listSourceFiles } from '../shared/scanner/files.js';
import { readRuntimeFsTextSync } from '../runtime/helpers/sync/index.js';
import { computeCacheContentHash, textByteLength, loadProjectFilesState, loadProjectRunState, saveProjectFilesState, saveProjectRunState } from './io/index.js';
import { computeInputFilesEpoch, diffProjectFiles } from './engine.js';
import { prepareCacheForRun } from './setup/index.js';
import type {
  CacheDispatchResult,
  CacheInputFilesEpochDebug,
  CacheProjectFileRecord,
  CachedProjectInput,
  CacheDispatchReason,
  CacheWarning,
} from '../types/cache/index.js';

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
      size: textByteLength(content, input.runtime),
      mtimeMs: 0,
      updatedAt: now,
    };
  }
  return out;
}

/**
 * Check-or-produce entry point for project cache slots.
 *
 * Scans the current source files, computes a delta against the baseline, and returns
 * cached data on a hit or calls `input.producer()` and persists the result on a miss.
 * When `baselineFiles` is provided (recommended), all dispatches in a run share the
 * same pre-run snapshot so sibling writes cannot mask real file changes.
 */
export function getOrBuildCachedProjectData<T>(input: CachedProjectInput<T>): CacheDispatchResult<T> {
  const warnings: CacheWarning[] = [];
  const state = input.state;
  const paths = {
    meta: state.metaPath,
    files: state.filesPath,
    snapshot: state.snapshotPath,
    analysis: state.analysisPath,
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
  const baseline = input.baselineFiles ?? prevFiles.files.files;
  const delta = diffProjectFiles(baseline, currentFiles);
  const hasFileChanges = delta.added.length + delta.changed.length + delta.deleted.length > 0;

  const prevRun = loadProjectRunState(state, input.runtime, input.cacheKey);
  warnings.push(...prevRun.warnings);
  let missReason: CacheDispatchReason = hasFileChanges ? 'files_changed' : 'run_missing';
  let inputFilesEpochDebug: CacheInputFilesEpochDebug | undefined;
  if (!hasFileChanges && prevRun.run?.data !== undefined) {
    const epochNow = computeInputFilesEpoch(currentFiles, input.runtime.hashText);
    if (prevRun.run.inputFilesEpoch !== epochNow) {
      missReason = 'run_binding_stale';
      inputFilesEpochDebug = { cached: prevRun.run.inputFilesEpoch, current: epochNow };
    } else {
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
  }

  const fresh = input.producer();
  const saveFilesWarn = saveProjectFilesState(state, { ...prevFiles.files, files: currentFiles }, input.runtime);
  if (saveFilesWarn) warnings.push(saveFilesWarn);
  const inputFilesEpoch = computeInputFilesEpoch(currentFiles, input.runtime.hashText);
  const saveRunWarn = saveProjectRunState(state, input.runtime, input.cacheKey, {
    data: fresh,
    inputFilesEpoch,
  });
  if (saveRunWarn) warnings.push(saveRunWarn);

  return {
    data: fresh,
    cache: {
      status: 'miss',
      reason: missReason,
      warnings,
      delta,
      paths,
      ...(inputFilesEpochDebug !== undefined ? { inputFilesEpochDebug } : {}),
    },
  };
}
