import type { CacheRuntime, CacheState } from '../types/cache/index.js';
import type {
  AnalysisCacheInvalidationDecision,
  LocaleWriteInvalidationInput,
} from '../types/cache/invalidation.js';
import { decideProjectAnalysisCacheInvalidation } from './invalidatePolicy.js';
import { tryDeleteCacheFile } from './setup/policy.js';

/** Drop `analysis.json` so the next scan repopulates from current project files. */
export function invalidateProjectAnalysisCache(state: CacheState, runtime: CacheRuntime): void {
  tryDeleteCacheFile(runtime, state.analysisPath);
}

/**
 * Apply post-mutation invalidation policy for locale writes (sync / generate).
 * Skips delete when dispatch can reuse or patch on the next run.
 */
export function invalidateProjectAnalysisCacheAfterLocaleWrites(
  state: CacheState,
  runtime: CacheRuntime,
  input: LocaleWriteInvalidationInput,
): AnalysisCacheInvalidationDecision {
  const decision = decideProjectAnalysisCacheInvalidation(input);
  if (decision.action === 'delete') {
    tryDeleteCacheFile(runtime, state.analysisPath);
  }
  return decision;
}
