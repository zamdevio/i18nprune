import {
  rgFixedStringSearch,
  rgFixedStringSearchLocations,
} from '@/utils/rg/index.js';
import type { StringLeaf } from '@/types/core/json/index.js';
import type { EffectiveReferenceConfig } from '@i18nprune/core/config';
import { resolveCleanupKeysWithStringPresencePolicy } from '@i18nprune/core';

export type StringPresenceLog = (message: string) => void;

/**
 * Final list of keys safe to remove from locale JSON, applying `reference.stringPresence` + optional rg.
 */
export function resolveCleanupKeysWithStringPresence(input: {
  candidates: readonly string[];
  leaves: readonly StringLeaf[];
  srcRoot: string;
  eff: Pick<EffectiveReferenceConfig, 'stringPresence' | 'stringPresenceMaxHitsPerKey'>;
  skipRg: boolean;
  rgOk: boolean;
  logDetail?: StringPresenceLog;
}): string[] {
  const { candidates, leaves, srcRoot, eff, skipRg, rgOk, logDetail } = input;
  const result = resolveCleanupKeysWithStringPresencePolicy({
    candidates,
    leaves,
    stringPresence: eff.stringPresence,
    stringPresenceMaxHitsPerKey: eff.stringPresenceMaxHitsPerKey,
    skipStringPresenceCheck: skipRg,
    stringPresenceAvailable: rgOk,
    hasStringPresence: (sample) => rgFixedStringSearch(srcRoot, sample),
    getStringPresenceLocations: (sample, maxHits) =>
      rgFixedStringSearchLocations(srcRoot, sample, maxHits).map((h) => `${h.path}:${String(h.line)}`),
  });
  if (logDetail) {
    for (const ev of result.evidence) {
      const hint = ev.locations.join(', ');
      if (ev.kind === 'guard_skipped') {
        logDetail(`cleanup: skipping key (string presence in src — not proof of static key): ${ev.key} — e.g. ${hint}`);
      } else {
        logDetail(`cleanup: string presence in src (removal still allowed — reference.stringPresence=warn): ${ev.key} — ${hint}`);
      }
    }
  }
  return result.safeToRemove;
}
