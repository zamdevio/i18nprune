import type { CoreContext } from '../../types/context/index.js';
import { computeTranslateConfigEpoch } from './translateConfigEpoch.js';
import { TranslateCacheL1Memo } from './l1Memo.js';

/** L1 runs unless the host passed `--no-cache` (`cli_no_cache`). */
export function translateCacheL1Enabled(ctx: CoreContext): boolean {
  return ctx.cache?.state.reason !== 'cli_no_cache';
}

/** Per-run in-memory translation memo for generate paths; undefined when L1 is bypassed. */
export function createTranslateCacheL1ForContext(ctx: CoreContext): TranslateCacheL1Memo | undefined {
  if (!translateCacheL1Enabled(ctx)) return undefined;
  return new TranslateCacheL1Memo({
    translateConfigEpoch: computeTranslateConfigEpoch(ctx.config.translate),
  });
}
