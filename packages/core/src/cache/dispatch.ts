import { classifyCacheFileDelta } from './deltaClassify.js';
import { resolveFilesIndexStatus } from './filesIndexStatus.js';
import { decideAnalysisRebuild } from './rebuildPolicy.js';
import { resolveCacheRebuildConfig } from './resolveConfig.js';
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
import { filesIndexIsUsable } from '../types/cache/filesIndex.js';
import type {
  CacheDispatchResult,
  CacheProjectFileRecord,
  CacheProjectFilesState,
  CachedProjectInput,
  CacheDispatchReason,
  CacheProducerContext,
  CacheWarning,
  FilesIndexStatus,
} from '../types/cache/index.js';

function assertLocalesInput<T>(input: CachedProjectInput<T>): asserts input is CachedProjectInput<T> & {
  localesDir: string;
  locales: NonNullable<CachedProjectInput<T>['locales']>;
} {
  if (input.localesDir === undefined || input.locales === undefined) {
    throw new Error('cache dispatch requires localesDir and locales');
  }
}

function baselineMergedFromDisk(prev: CacheProjectFilesState): Record<string, CacheProjectFileRecord> {
  return mergeTrackedFileMaps(omitSyntheticSourceKey(prev.files), prev.localeSegments ?? {});
}

function resolveTrackedCurrent<T>(
  input: CachedProjectInput<T> & { localesDir: string; locales: NonNullable<CachedProjectInput<T>['locales']> },
  prev: CacheProjectFilesState,
): TrackedProjectFilesCurrent {
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

function sourceLocaleSegmentKey<T>(input: CachedProjectInput<T>): string {
  return input.runtime.path.relative(input.localesDir, input.sourceLocalePath).replace(/\\/g, '/');
}

function buildProducerContext<T>(input: {
  input: CachedProjectInput<T>;
  delta: CacheProducerContext<T>['delta'];
  tracked: TrackedProjectFilesCurrent;
  prev: CacheProjectFilesState;
  previous?: T;
  filesIndexStatus: FilesIndexStatus;
}): CacheProducerContext<T> {
  const currentSrcFileKeys = new Set(Object.keys(omitSyntheticSourceKey(input.tracked.files)));
  const baselineSrcFileKeys = new Set(Object.keys(omitSyntheticSourceKey(input.prev.files)));
  const currentLocaleSegmentKeys = new Set(Object.keys(input.tracked.localeSegments));
  const baselineLocaleSegmentKeys = new Set(Object.keys(input.prev.localeSegments ?? {}));
  const classified = classifyCacheFileDelta({
    delta: input.delta,
    currentSrcFileKeys,
    baselineSrcFileKeys,
    currentLocaleSegmentKeys,
    baselineLocaleSegmentKeys,
    sourceLocaleSegmentKey: sourceLocaleSegmentKey(input.input),
    previousLayout: input.prev.localesLayout,
    currentLayout: input.tracked.localesLayout,
    filesIndexStatus: input.filesIndexStatus,
  });
  const rebuildConfig = input.input.rebuildConfig ?? resolveCacheRebuildConfig({ profile: 'balanced' });
  const trackedSrcCount = currentSrcFileKeys.size;
  const analysisRebuild = {
    ...decideAnalysisRebuild({
      config: rebuildConfig,
      classified,
      hasPrevious: input.previous !== undefined,
      trackedSrcCount,
    }),
    srcDelta: classified.src,
  };
  return {
    delta: input.delta,
    classified,
    previous: input.previous,
    trackedSrcCount,
    rebuildConfig,
    analysisRebuild,
  };
}

function persistFilesAndRunState<T>(input: {
  state: CachedProjectInput<T>['state'];
  runtime: CachedProjectInput<T>['runtime'];
  nextIndex: CacheProjectFilesState;
  data: T;
  inputFilesEpoch: string;
  warnings: CacheWarning[];
}): void {
  const saveFilesWarn = saveProjectFilesState(input.state, input.nextIndex, input.runtime);
  if (saveFilesWarn) input.warnings.push(saveFilesWarn);
  const saveRunWarn = saveProjectRunState(input.state, input.runtime, {
    data: input.data,
    inputFilesEpoch: input.inputFilesEpoch,
  });
  if (saveRunWarn) input.warnings.push(saveRunWarn);
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
  const rebuildConfig = input.rebuildConfig ?? resolveCacheRebuildConfig({ profile: 'balanced' });
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
  const filesIndexStatus = resolveFilesIndexStatus({
    prev,
    warnings: prevFiles.warnings,
    filesPath: state.filesPath,
    runtime: input.runtime,
  });

  assertLocalesInput(input);
  const tracked = resolveTrackedCurrent(input, prev);
  const currentFiles = tracked.merged;
  const baseline = input.baselineFiles ?? baselineMergedFromDisk(prev);
  const delta = diffProjectFiles(baseline, currentFiles);
  const hasFileChanges = delta.added.length + delta.changed.length + delta.deleted.length > 0;
  const inputFilesEpoch = computeInputFilesEpoch(currentFiles, input.runtime.hashText);

  const prevRun = loadProjectRunState(state, input.runtime);
  warnings.push(...prevRun.warnings);

  let previous: T | undefined;
  if (prevRun.run?.data !== undefined && input.parseCachedData) {
    const parsedPrevious = input.parseCachedData(prevRun.run.data);
    if (parsedPrevious.ok) previous = parsedPrevious.data;
  }

  const filesIndexRecoverable =
    !filesIndexIsUsable(filesIndexStatus) &&
    hasFileChanges &&
    previous !== undefined &&
    prevRun.run?.inputFilesEpoch === inputFilesEpoch;

  if (filesIndexRecoverable && previous !== undefined) {
    const nextIndex: CacheProjectFilesState = {
      ...prev,
      files: tracked.files,
      localeSegments: tracked.localeSegments,
      localesLayout: tracked.localesLayout,
    };
    persistFilesAndRunState({
      state,
      runtime: input.runtime,
      nextIndex,
      data: previous,
      inputFilesEpoch,
      warnings,
    });
    return {
      data: previous,
      cache: {
        status: 'hit',
        reason: 'files_index_recovered',
        warnings,
        delta,
        paths,
        analysisRebuild: { strategy: 'reuse', reason: 'files_index_recovered' },
        filesIndexStatus,
      },
    };
  }

  let missReason: CacheDispatchReason = hasFileChanges ? 'files_changed' : 'run_missing';
  let inputFilesEpochDebug: import('../types/cache/index.js').CacheInputFilesEpochDebug | undefined;
  if (!hasFileChanges && prevRun.run?.data !== undefined) {
    if (prevRun.run.inputFilesEpoch !== inputFilesEpoch) {
      missReason = 'run_binding_stale';
      inputFilesEpochDebug = { cached: prevRun.run.inputFilesEpoch, current: inputFilesEpoch };
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

  const producerCtx = buildProducerContext({
    input: { ...input, rebuildConfig },
    delta,
    tracked,
    prev,
    previous,
    filesIndexStatus,
  });
  const fresh = input.producer(producerCtx);
  const nextIndex: CacheProjectFilesState = {
    ...prev,
    files: tracked.files,
    localeSegments: tracked.localeSegments,
    localesLayout: tracked.localesLayout,
  };

  persistFilesAndRunState({
    state,
    runtime: input.runtime,
    nextIndex,
    data: fresh,
    inputFilesEpoch,
    warnings,
  });

  return {
    data: fresh,
    cache: {
      status: 'miss',
      reason: missReason,
      warnings,
      delta,
      paths,
      analysisRebuild: producerCtx.analysisRebuild,
      filesIndexStatus: filesIndexIsUsable(filesIndexStatus) ? undefined : filesIndexStatus,
      ...(inputFilesEpochDebug !== undefined ? { inputFilesEpochDebug } : {}),
    },
  };
}
