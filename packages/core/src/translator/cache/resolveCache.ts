import { computeInputFilesEpoch } from '../../cache/engine.js';
import { loadProjectFilesState } from '../../cache/io/state.js';
import { mergeTrackedFileMaps, omitSyntheticSourceKey } from '../../cache/trackedFiles.js';
import type { CacheWarning } from '../../types/cache/index.js';
import type { CoreContext } from '../../types/context/index.js';
import type {
  GenerateTranslateCache,
  GenerateTranslateCacheBase,
  OpenTranslateCacheL2Options,
  TranslateCacheL2Port,
} from '../../types/translator/cache.js';
import { computeTranslateConfigEpoch } from './translateConfigEpoch.js';
import { TranslateCacheL2Store } from './l2Store.js';
import { createTranslateCacheL1ForContext, translateCacheL1Enabled } from './resolveL1.js';

function resolveInputFilesEpoch(ctx: CoreContext): string | undefined {
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

/** L2 disk cache runs when project cache is enabled and the run is not bypassing L2. */
export function translateCacheL2Enabled(ctx: CoreContext, opts?: OpenTranslateCacheL2Options): boolean {
  if (opts?.bypassL2 === true) return false;
  return ctx.cache?.state.enabled === true;
}

/**
 * Create the per-run L1 memo shared across targets in one generate invocation.
 *
 * @remarks L2 is opened per target via {@link openTranslateCacheL2ForTarget}.
 */
export function createGenerateTranslateCache(
  ctx: CoreContext,
  _opts?: OpenTranslateCacheL2Options,
): { cache: GenerateTranslateCacheBase; warnings: CacheWarning[] } {
  const l1 = createTranslateCacheL1ForContext(ctx);
  return { cache: { l1 }, warnings: [] };
}

/** Open on-disk L2 for one target locale (`translations/<targetLang>.json`). */
export function openTranslateCacheL2ForTarget(
  ctx: CoreContext,
  targetLang: string,
  opts?: OpenTranslateCacheL2Options,
): { l2?: TranslateCacheL2Store; warnings: CacheWarning[] } {
  const warnings: CacheWarning[] = [];
  if (!translateCacheL2Enabled(ctx, opts)) return { warnings };
  const cache = ctx.cache;
  if (!cache) return { warnings };
  const inputFilesEpoch = resolveInputFilesEpoch(ctx);
  if (inputFilesEpoch === undefined) return { warnings };
  const translateConfigEpoch = computeTranslateConfigEpoch(ctx.config.translate);
  const opened = TranslateCacheL2Store.open({
    state: cache.state,
    runtime: cache.runtime,
    targetLang,
    inputFilesEpoch,
    translateConfigEpoch,
  });
  warnings.push(...opened.warnings);
  return { l2: opened.store, warnings };
}

/** Attach a per-target L2 store to the shared L1 base. */
export function bindGenerateTranslateCache(
  base: GenerateTranslateCacheBase,
  l2?: TranslateCacheL2Port,
): GenerateTranslateCache {
  return { l1: base.l1, l2 };
}

/** Persist L2 rows for the current target when the store is dirty. */
export function flushTranslateCacheL2(l2?: TranslateCacheL2Port): CacheWarning | undefined {
  return l2?.flush();
}

export { translateCacheL1Enabled };
