import type { StringLeaf } from '../types/json/index.js';
import type { StringPresencePolicy } from '../types/reference/index.js';

export type CleanupStringPresenceEvidence = {
  key: string;
  kind: 'guard_skipped' | 'warn_hit';
  locations: string[];
};

export type ResolveCleanupKeysWithStringPresenceInput = {
  candidates: readonly string[];
  leaves: readonly StringLeaf[];
  stringPresence: StringPresencePolicy;
  stringPresenceMaxHitsPerKey: number;
  skipStringPresenceCheck: boolean;
  stringPresenceAvailable: boolean;
  hasStringPresence: (sample: string) => boolean;
  getStringPresenceLocations: (sample: string, maxHits: number) => string[];
};

/**
 * Pure policy evaluator for cleanup string-presence handling.
 * Host provides the underlying presence probe and optional locations lookup.
 */
export function resolveCleanupKeysWithStringPresencePolicy(
  input: ResolveCleanupKeysWithStringPresenceInput,
): { safeToRemove: string[]; evidence: CleanupStringPresenceEvidence[] } {
  const safeToRemove: string[] = [];
  const evidence: CleanupStringPresenceEvidence[] = [];

  for (const key of input.candidates) {
    const sample = input.leaves.find((l) => l.path === key)?.value ?? key;
    if (input.stringPresence === 'off' || input.skipStringPresenceCheck || !input.stringPresenceAvailable) {
      safeToRemove.push(key);
      continue;
    }

    const hit = input.hasStringPresence(sample);
    if (input.stringPresence === 'guard') {
      if (!hit) {
        safeToRemove.push(key);
        continue;
      }
      evidence.push({
        key,
        kind: 'guard_skipped',
        locations: input.getStringPresenceLocations(sample, input.stringPresenceMaxHitsPerKey),
      });
      continue;
    }

    if (hit) {
      evidence.push({
        key,
        kind: 'warn_hit',
        locations: input.getStringPresenceLocations(sample, input.stringPresenceMaxHitsPerKey),
      });
    }
    safeToRemove.push(key);
  }

  return { safeToRemove, evidence };
}
