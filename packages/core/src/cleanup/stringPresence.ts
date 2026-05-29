import type { StringLeaf } from '../types/json/index.js';
import type { StringPresencePolicy } from '../types/reference/index.js';

/** Shorter translation values produce too many substring false positives in fixed-string src search. */
export const CLEANUP_MIN_VALUE_STRING_PRESENCE_LENGTH = 4;

/**
 * Probe text for string-presence on translation **values** only.
 * Returns `null` when the value is too short — static scan already marked the key unused; rg on
 * short text or key ids produces substring false positives (`s`, `as`, etc.).
 */
export function cleanupStringPresenceProbe(_key: string, value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length >= CLEANUP_MIN_VALUE_STRING_PRESENCE_LENGTH) {
    return trimmed;
  }
  return null;
}

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
  shouldRunStringPresenceForKey?: (input: { key: string; value: string }) => boolean;
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
    const leafValue = input.leaves.find((l) => l.path === key)?.value ?? key;
    if (input.shouldRunStringPresenceForKey && !input.shouldRunStringPresenceForKey({ key, value: leafValue })) {
      safeToRemove.push(key);
      continue;
    }
    const sample = cleanupStringPresenceProbe(key, leafValue);
    if (
      input.stringPresence === 'off' ||
      input.skipStringPresenceCheck ||
      !input.stringPresenceAvailable ||
      sample === null
    ) {
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
