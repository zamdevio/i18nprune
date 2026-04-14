import {
  rgFixedStringSearch,
  rgFixedStringSearchLocations,
} from '@/utils/rg/index.js';
import type { StringLeaf } from '@/types/core/json/index.js';
import type { EffectiveReferenceConfig } from '@/types/config/reference.js';

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
  const maxHits = eff.stringPresenceMaxHitsPerKey;
  const safeToRemove: string[] = [];

  for (const key of candidates) {
    const sample = leaves.find((l) => l.path === key)?.value ?? key;
    if (eff.stringPresence === 'off' || skipRg || !rgOk) {
      safeToRemove.push(key);
      continue;
    }
    if (eff.stringPresence === 'guard') {
      const hit = rgFixedStringSearch(srcRoot, sample);
      if (!hit) safeToRemove.push(key);
      else if (logDetail) {
        const locs = rgFixedStringSearchLocations(srcRoot, sample, maxHits);
        const hint = locs.map((h) => `${h.path}:${String(h.line)}`).join(', ');
        logDetail(
          `cleanup: skipping key (string presence in src — not proof of static key): ${key} — e.g. ${hint}`,
        );
      }
      continue;
    }
    const hit = rgFixedStringSearch(srcRoot, sample);
    if (hit && logDetail) {
      const locs = rgFixedStringSearchLocations(srcRoot, sample, maxHits);
      const hint = locs.map((h) => `${h.path}:${String(h.line)}`).join(', ');
      logDetail(
        `cleanup: string presence in src (removal still allowed — reference.stringPresence=warn): ${key} — ${hint}`,
      );
    }
    safeToRemove.push(key);
  }

  return safeToRemove;
}
