import { IdentityAbortError } from './error.js';
import { buildIdentityStreakIssue } from './issue.js';
import {
  IDENTITY_STREAK_THRESHOLD,
  isIdentityTranslation,
  nextIdentityStreakState,
} from './state.js';
import type { IdentitySample, IdentityStreakState } from '../../types/translator/identityStreak.js';
import type { IdentityStreakGuard, IdentityStreakGuardOptions } from '../../types/translator/identityStreak.js';
import type { Issue } from '../../types/json/envelope/index.js';

/** How many recent source-identical pairs the host's confirm UI may render. */
export const IDENTITY_STREAK_SAMPLE_MAX = 5;

/**
 * Pure factory for the source-identical streak guard. The host wires UI / TTY / `--yes` /
 * `--json` gates and supplies them via {@link IdentityStreakGuardOptions}; this module
 * never touches `process.*`, `console.*`, or any logger.
 *
 * Behavior at every cap multiple (8, 16, 24, …):
 * 1. Push an `i18nprune.translate.identity_streak_warning` issue (always).
 * 2. If `interactive()` is `false` or no `confirm` callback supplied → continue silently.
 * 3. Else `await confirm(...)`; `false` → throw {@link IdentityAbortError}, `true` → continue.
 *
 * Aligns with `translate-policy (shipped)` D9: "Run never aborts because of one leaf."
 */
export function createIdentityStreakGuard(opts: IdentityStreakGuardOptions): IdentityStreakGuard {
  const threshold = opts.threshold ?? IDENTITY_STREAK_THRESHOLD;
  const interactive = opts.interactive ?? ((): boolean => false);

  let state: IdentityStreakState = { consecutiveIdentity: 0, lastPath: '' };
  let recentIdentitySamples: IdentitySample[] = [];
  const issues: Issue[] = [];

  return {
    async onTranslated(sourceText: string, translatedText: string, path: string): Promise<void> {
      const wasIdentity = isIdentityTranslation(sourceText, translatedText);
      state = nextIdentityStreakState(state, { sourceText, translatedText, path });
      if (wasIdentity) {
        recentIdentitySamples = [
          ...recentIdentitySamples,
          { sourceText, translatedText, path },
        ].slice(-IDENTITY_STREAK_SAMPLE_MAX);
      } else {
        recentIdentitySamples = [];
      }

      if (state.consecutiveIdentity < threshold) return;
      if (state.consecutiveIdentity % threshold !== 0) return;

      const latestPath = state.lastPath || path;

      issues.push(
        buildIdentityStreakIssue({
          severity: 'warning',
          target: opts.target,
          count: state.consecutiveIdentity,
          path: latestPath,
        }),
      );

      if (!interactive() || !opts.confirm) return;

      const ok = await opts.confirm({
        command: opts.command,
        target: opts.target,
        count: state.consecutiveIdentity,
        latestPath,
        samples: recentIdentitySamples,
      });
      if (!ok) {
        throw new IdentityAbortError(
          opts.command,
          opts.target,
          threshold,
          state.consecutiveIdentity,
          latestPath,
        );
      }
    },
    flushIssues(): Issue[] {
      return issues.slice();
    },
  };
}
