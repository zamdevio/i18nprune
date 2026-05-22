import { isEmptyInputFilesEpoch, isTrackedFilesMapEmpty } from '../../cache/emptyEpoch.js';
import { computeInputFilesEpoch } from '../../cache/engine.js';
import { resolveFilesIndexStatus } from '../../cache/filesIndexStatus.js';
import { loadProjectFilesState } from '../../cache/io/state.js';
import { mergeTrackedFileMaps, omitSyntheticSourceKey } from '../../cache/trackedFiles.js';
import type { CacheHashText, CacheProjectFileRecord } from '../../types/cache/index.js';
import type { CoreContext } from '../../types/context/index.js';

function epochFromMerged(
  merged: Record<string, CacheProjectFileRecord>,
  hashText?: CacheHashText,
): string | undefined {
  if (isTrackedFilesMapEmpty(merged)) return undefined;
  const epoch = computeInputFilesEpoch(merged, hashText);
  return isEmptyInputFilesEpoch(epoch) ? undefined : epoch;
}

/**
 * Digest of the tracked `files.json` map for this run (same basis as analysis / translate cache).
 * Returns `undefined` when project cache is disabled, the files index is missing/empty, or no files are tracked yet.
 */
export function resolveShareInputFilesEpoch(ctx: CoreContext): string | undefined {
  const cache = ctx.cache;
  if (!cache?.state.enabled) return undefined;
  const { state, runtime, baselineFiles } = cache;
  if (baselineFiles !== undefined) {
    return epochFromMerged(baselineFiles, runtime.hashText);
  }
  const loaded = loadProjectFilesState(state, runtime);
  const filesIndexStatus = resolveFilesIndexStatus({
    prev: loaded.files,
    warnings: loaded.warnings,
    filesPath: state.filesPath,
    runtime,
  });
  if (filesIndexStatus.kind !== 'ok') return undefined;
  const merged = mergeTrackedFileMaps(
    omitSyntheticSourceKey(loaded.files.files),
    loaded.files.localeSegments ?? {},
  );
  return epochFromMerged(merged, runtime.hashText);
}
