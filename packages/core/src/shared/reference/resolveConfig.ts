import type {
  EffectiveReferenceConfig,
  ReferenceConfigSource,
} from '../../types/reference/index.js';

const BASE: EffectiveReferenceConfig = {
  treatCommentedCallSitesAsRuntime: false,
  treatNonSourceFileSitesAsRuntime: false,
  uncertainKeyPolicy: 'protect',
  stringPresence: 'guard',
  stringPresenceMaxHitsPerKey: 5,
  respectPreserve: true,
};

/** Which reference policy slice to resolve (matches keys under `reference.commands` in config). */
type ReferenceOperationId = 'cleanup' | 'fill' | 'sync' | 'generate';

/**
 * Merge `reference.defaults` and `reference.commands[operation]` into one effective policy.
 */
export function resolveReferenceConfig(
  operation: ReferenceOperationId,
  config: ReferenceConfigSource,
): EffectiveReferenceConfig {
  const ref = config.reference;
  const d = ref?.defaults ?? {};
  const cmd = ref?.commands?.[operation] ?? {};
  const merged = { ...BASE, ...d, ...cmd };
  return {
    treatCommentedCallSitesAsRuntime:
      merged.treatCommentedCallSitesAsRuntime ?? BASE.treatCommentedCallSitesAsRuntime,
    treatNonSourceFileSitesAsRuntime:
      merged.treatNonSourceFileSitesAsRuntime ?? BASE.treatNonSourceFileSitesAsRuntime,
    uncertainKeyPolicy: merged.uncertainKeyPolicy ?? BASE.uncertainKeyPolicy,
    stringPresence: merged.stringPresence ?? BASE.stringPresence,
    stringPresenceMaxHitsPerKey: merged.stringPresenceMaxHitsPerKey ?? BASE.stringPresenceMaxHitsPerKey,
    respectPreserve: merged.respectPreserve ?? BASE.respectPreserve,
  };
}
