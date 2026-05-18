import type { CacheRuntime, CacheState } from '../types/cache/index.js';
import { tryDeleteCacheFile } from './setup/policy.js';

/** Drop `analysis.json` so the next scan repopulates from current project files. */
export function invalidateProjectAnalysisCache(state: CacheState, runtime: CacheRuntime): void {
  tryDeleteCacheFile(runtime, state.analysisPath);
}
