import { IdentityAbortError } from './error.js';
import { buildIdentityStreakIssue } from './issue.js';
import {
  IDENTITY_STREAK_THRESHOLD,
  isIdentityTranslation,
  nextIdentityStreakState,
  type IdentitySample,
  type IdentityStreakState,
} from './state.js';
import type { Issue } from '../../types/json/envelope/index.js';

/** How many recent source-identical pairs the host's confirm UI may render. */
export const IDENTITY_STREAK_SAMPLE_MAX = 5;

/**
 * Host-supplied predicate: should we ask the user right now? When this returns `false`
 * (CLI `--yes` / `--json` / non-TTY / SDK headless) the guard emits the warning issue
 * and continues silently — it does NOT abort the run on its own. Only an explicit
 * `false` return from {@link IdentityStreakConfirmFn} aborts.
 */
export type IdentityStreakInteractive = () => boolean;

export type IdentityStreakConfirmInput = {
  command: string;
  target: string;
  count: number;
  latestPath: string;
  samples: readonly IdentitySample[];
};

/**
 * Host-supplied confirm callback. Resolves `true` to keep translating, `false` to abort
 * (throws {@link IdentityAbortError} from the guard). The host owns the UI: inquirer
 * prompt + progress-bar lift in CLI; whatever the SDK consumer wants elsewhere. The host
 * picks the UI default (CLI uses **Y / Enter = continue**, **N = stop**).
 */
export type IdentityStreakConfirmFn = (input: IdentityStreakConfirmInput) => Promise<boolean>;

export type IdentityStreakGuardOptions = {
  command: string;
  target: string;
  threshold?: number;
  /**
   * When `false` (default), the guard emits the warning issue at every cap-multiple and
   * keeps translating. When `true`, the guard calls {@link confirm}; if `confirm` is not
   * supplied the guard still continues (no abort).
   */
  interactive?: IdentityStreakInteractive;
  /** Required when `interactive()` may return `true`; otherwise ignored. */
  confirm?: IdentityStreakConfirmFn;
};

export type IdentityStreakGuard = {
  onTranslated: (sourceText: string, translatedText: string, path: string) => Promise<void>;
  flushIssues: () => Issue[];
};

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
 * Aligns with `translate-policy.md` D9: "Run never aborts because of one leaf."
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
