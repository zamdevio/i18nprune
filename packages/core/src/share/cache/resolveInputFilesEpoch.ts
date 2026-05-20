import { computeInputFilesEpoch } from '../../cache/engine.js';
import { loadProjectFilesState } from '../../cache/io/state.js';
import { mergeTrackedFileMaps, omitSyntheticSourceKey } from '../../cache/trackedFiles.js';
import type { CoreContext } from '../../types/context/index.js';

/**
 * Digest of the tracked `files.json` map for this run (same basis as analysis / translate cache).
 * Returns `undefined` when project cache is disabled or files state cannot be loaded.
 */
export function resolveShareInputFilesEpoch(ctx: CoreContext): string | undefined {
  const cache = ctx.cache;
  if (!cache?.state.enabled) return undefined;
  const { state, runtime, baselineFiles } = cache;
  if (baselineFiles !== undefined) {
    return computeInputFilesEpoch(baselineFiles, runtime.hashText);
  }
  const loaded = loadProjectFilesState(state, runtime);
  const merged = mergeTrackedFileMaps(
    omitSyntheticSourceKey(loaded.files.files),
    loaded.files.localeSegments ?? {},
  );
  return computeInputFilesEpoch(merged, runtime.hashText);
}
