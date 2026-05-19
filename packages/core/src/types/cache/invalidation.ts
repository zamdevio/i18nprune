import type { CacheRebuildConfig } from './rebuild.js';

export type AnalysisCacheInvalidationAction = 'delete' | 'skip';

export type AnalysisCacheInvalidationReason =
  | 'cache_disabled'
  | 'no_locale_writes'
  | 'config_rebuild_full'
  | 'target_locale_writes_only'
  | 'locale_writes_dispatch_handles';

export type AnalysisCacheInvalidationDecision = {
  action: AnalysisCacheInvalidationAction;
  reason: AnalysisCacheInvalidationReason;
};

export type LocaleWriteInvalidationInput = {
  enabled: boolean;
  rebuildConfig: CacheRebuildConfig;
  sourceLocaleSegmentKey: string;
  mutatedLocaleSegmentKeys: readonly string[];
};
