import type { I18nPruneConfig } from '@/types/config/index.js';
import type { EffectiveReferenceConfig } from '@/types/config/reference.js';

const BASE: EffectiveReferenceConfig = {
  treatCommentedCallSitesAsRuntime: false,
  treatNonSourceFileSitesAsRuntime: false,
  uncertainKeyPolicy: 'protect',
  stringPresence: 'guard',
  stringPresenceMaxHitsPerKey: 5,
  respectPreserve: true,
};

type CommandName = 'cleanup' | 'fill' | 'sync' | 'generate';

/**
 * Merge `reference.defaults` and `reference.commands[command]` into one effective policy.
 */
export function resolveReferenceConfig(
  command: CommandName,
  config: I18nPruneConfig,
): EffectiveReferenceConfig {
  const ref = config.reference;
  const d = ref?.defaults ?? {};
  const cmd = ref?.commands?.[command] ?? {};
  const merged = { ...BASE, ...d, ...cmd };
  return {
    treatCommentedCallSitesAsRuntime: merged.treatCommentedCallSitesAsRuntime ?? BASE.treatCommentedCallSitesAsRuntime,
    treatNonSourceFileSitesAsRuntime: merged.treatNonSourceFileSitesAsRuntime ?? BASE.treatNonSourceFileSitesAsRuntime,
    uncertainKeyPolicy: merged.uncertainKeyPolicy ?? BASE.uncertainKeyPolicy,
    stringPresence: merged.stringPresence ?? BASE.stringPresence,
    stringPresenceMaxHitsPerKey: merged.stringPresenceMaxHitsPerKey ?? BASE.stringPresenceMaxHitsPerKey,
    respectPreserve: merged.respectPreserve ?? BASE.respectPreserve,
  };
}
