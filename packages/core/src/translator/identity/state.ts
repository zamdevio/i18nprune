/**
 * Pure state predicates for the source-identical streak guard. No host or process access.
 * The CLI's TTY confirm UI lives in `packages/cli/src/shared/translator/identity.ts`.
 */

/**
 * Default consecutive-source-identical count that arms the warning + confirm prompt.
 * Re-used by every host (CLI today; SDK tomorrow) unless `runGenerate` overrides it via
 * `identityGuard.thresholdRatio`.
 */
export const IDENTITY_STREAK_THRESHOLD = 8;

import type { IdentityStreakState } from '../../types/translator/identityStreak.js';

function normalizeIdentityText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** True when normalized source and translation match — **excluding** whitespace-only sources (never counts toward streak). */
export function isIdentityTranslation(sourceText: string, translatedText: string): boolean {
  const ns = normalizeIdentityText(sourceText);
  if (ns === '') return false;
  return ns === normalizeIdentityText(translatedText);
}

export function nextIdentityStreakState(
  state: IdentityStreakState,
  input: { sourceText: string; translatedText: string; path: string },
): IdentityStreakState {
  if (isIdentityTranslation(input.sourceText, input.translatedText)) {
    return {
      consecutiveIdentity: state.consecutiveIdentity + 1,
      lastPath: input.path,
    };
  }
  return {
    consecutiveIdentity: 0,
    lastPath: input.path,
  };
}
