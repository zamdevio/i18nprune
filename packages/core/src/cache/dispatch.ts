import { layoutMatches, resolveCachedLocalesLayout } from './localesLayout.js';
import {
  buildTrackedProjectFilesCurrent,
  mergeTrackedFileMaps,
  omitSyntheticSourceKey,
  type TrackedProjectFilesCurrent,
} from './trackedFiles.js';
import { computeInputFilesEpoch, diffProjectFiles } from './engine.js';
import { loadProjectFilesState, loadProjectRunState, saveProjectFilesState, saveProjectRunState } from './io/index.js';
import { prepareCacheForRun } from './setup/index.js';
import type {
  CacheDispatchResult,
  CacheInputFilesEpochDebug,
  CacheProjectFileRecord,
  CacheProjectFilesState,
  CachedProjectInput,
  CacheDispatchReason,
  CacheWarning,
} from '../types/cache/index.js';

function assertLocalesInput(input: CachedProjectInput<unknown>): asserts input is CachedProjectInput<unknown> & {
  localesDir: string;
  locales: NonNullable<CachedProjectInput<unknown>['locales']>;
} {
  if (input.localesDir === undefined || input.locales === undefined) {
    throw new Error('cache dispatch requires localesDir and locales');
  }
}

function baselineMergedFromDisk(prev: CacheProjectFilesState): Record<string, CacheProjectFileRecord> {
  return mergeTrackedFileMaps(omitSyntheticSourceKey(prev.files), prev.localeSegments ?? {});
}

function resolveTrackedCurrent<T>(
  input: CachedProjectInput<T>,
  prev: CacheProjectFilesState,
): TrackedProjectFilesCurrent {
  assertLocalesInput(input);
  const locales = input.locales;
  const localesDir = input.localesDir;
  const hasCachedLayout = prev.localesLayout !== undefined;
  const layoutMatch = layoutMatches(prev.localesLayout, resolveCachedLocalesLayout(locales));
  const scanSrc = !hasCachedLayout || layoutMatch;

  return buildTrackedProjectFilesCurrent({
    runtime: input.runtime,
    srcRoot: input.srcRoot,
    exclude: input.exclude,
    localesDir,
    locales,
    scanSrc,
    ...(scanSrc ? {} : { reuseSrcFiles: omitSyntheticSourceKey(prev.files) }),
  });
}

/**
 * Check-or-produce entry point for `analysis.json`.
 *
 * Scans tracked project files, computes a delta against the baseline, and returns
 * cached analysis on a hit or calls `input.producer()` and persists on a miss.
 */
export function getOrBuildCachedProjectData<T>(input: CachedProjectInput<T>): CacheDispatchResult<T> {
  const warnings: CacheWarning[] = [];
  const state = input.state;
  const paths = {
    meta: state.metaPath,
    files: state.filesPath,
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

  const prevFiles = loadProjectFilesState(state, input.runtime);
  warnings.push(...prevFiles.warnings);
  const prev = prevFiles.files;

  const tracked = resolveTrackedCurrent(input, prev);
  const currentFiles = tracked.merged;
  const baseline = input.baselineFiles ?? baselineMergedFromDisk(prev);
  const delta = diffProjectFiles(baseline, currentFiles);
  const hasFileChanges = delta.added.length + delta.changed.length + delta.deleted.length > 0;

  const prevRun = loadProjectRunState(state, input.runtime);
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
  const nextIndex: CacheProjectFilesState = {
    ...prev,
    files: tracked.files,
    localeSegments: tracked.localeSegments,
    localesLayout: tracked.localesLayout,
  };

  const saveFilesWarn = saveProjectFilesState(state, nextIndex, input.runtime);
  if (saveFilesWarn) warnings.push(saveFilesWarn);
  const inputFilesEpoch = computeInputFilesEpoch(currentFiles, input.runtime.hashText);
  const saveRunWarn = saveProjectRunState(state, input.runtime, {
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
