import type {
  AnalysisCacheInvalidationDecision,
  LocaleWriteInvalidationInput,
} from '../types/cache/invalidation.js';

function normalizeSegmentKey(key: string): string {
  return key.replace(/\\/g, '/');
}

/** Decide whether sync/generate should delete `analysis.json` or defer to dispatch rebuild policy. */
export function decideProjectAnalysisCacheInvalidation(
  input: LocaleWriteInvalidationInput,
): AnalysisCacheInvalidationDecision {
  if (!input.enabled) {
    return { action: 'skip', reason: 'cache_disabled' };
  }
  if (input.mutatedLocaleSegmentKeys.length === 0) {
    return { action: 'skip', reason: 'no_locale_writes' };
  }
  if (input.rebuildConfig.rebuild === 'full') {
    return { action: 'delete', reason: 'config_rebuild_full' };
  }

  const sourceKey = normalizeSegmentKey(input.sourceLocaleSegmentKey);
  const sourceMutated = input.mutatedLocaleSegmentKeys.some(
    (key) => normalizeSegmentKey(key) === sourceKey,
  );
  if (!sourceMutated) {
    return { action: 'skip', reason: 'target_locale_writes_only' };
  }

  return { action: 'skip', reason: 'locale_writes_dispatch_handles' };
}
