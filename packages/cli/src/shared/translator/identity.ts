import { ExitPromptError } from '@inquirer/core';
import { confirm } from '@inquirer/prompts';
import { issueCodeRepoDocPathForIssueCode } from '@i18nprune/core';
import {
  ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT,
  ISSUE_TRANSLATE_IDENTITY_STREAK_WARNING,
} from '@/constants/issueCodes.js';
import { canAsk } from '@/shared/ask/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { truncateMiddle } from '@/shared/progress/format.js';
import { style } from '@/utils/style/index.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import { logger } from '@/utils/logger/index.js';
import { duringPrompt } from '@/utils/timer/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { Issue } from '@/types/core/json/envelope.js';

export const IDENTITY_STREAK_THRESHOLD = 8;

/** How many recent source-identical pairs to show before the continue prompt. */
const IDENTITY_STREAK_SAMPLE_MAX = 5;

export type IdentitySample = {
  readonly sourceText: string;
  readonly translatedText: string;
  readonly path: string;
};

export class IdentityAbortError extends Error {
  constructor(
    public readonly command: string,
    public readonly target: string,
    public readonly threshold: number,
    public readonly count: number,
    public readonly path: string,
  ) {
    super(
      `${command}: aborted after ${String(count)} consecutive source-identical translations for ${target} (threshold: ${String(threshold)}, latest: ${path})`,
    );
    this.name = 'IdentityAbortError';
  }
}

function normalizeIdentityText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** True when normalized source and translation match — **excluding** whitespace-only sources (never counts toward streak). */
export function isIdentityTranslation(sourceText: string, translatedText: string): boolean {
  const ns = normalizeIdentityText(sourceText);
  if (ns === '') return false;
  return ns === normalizeIdentityText(translatedText);
}

export type IdentityStreakState = {
  consecutiveIdentity: number;
  lastPath: string;
};

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

export function buildIdentityStreakIssue(params: {
  severity: 'warning' | 'error';
  target: string;
  count: number;
  path: string;
}): Issue {
  const code =
    params.severity === 'error'
      ? ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT
      : ISSUE_TRANSLATE_IDENTITY_STREAK_WARNING;
  return {
    severity: params.severity,
    code,
    message: `Target "${params.target}" produced ${String(params.count)} consecutive source-identical translations (latest path: ${params.path}).`,
    docPath: issueCodeRepoDocPathForIssueCode(code),
  };
}

/** Route identity **`confirm`** onto the same stream as the translation bar (stderr when a TTY) so terminals do not splice stdout + stderr into corrupted lines. */
function inquirerContextForIdentityPrompt(): {
  output: NodeJS.WritableStream;
  clearPromptOnDone: boolean;
} {
  if (process.stderr.isTTY) {
    return { output: process.stderr, clearPromptOnDone: true };
  }
  return {
    output: process.stdout,
    clearPromptOnDone: Boolean(process.stdout.isTTY),
  };
}

function buildIdentityStreakConfirmMessage(input: {
  command: string;
  target: string;
  count: number;
  latestPath: string;
  samples: readonly IdentitySample[];
}): string {
  const lines: string[] = [];
  if (input.samples.length > 0) {
    lines.push(style.dim('Recent source → model output (same text; max 5):'));
    for (const s of input.samples) {
      const src = truncateMiddle(s.sourceText.replace(/\s+/g, ' ').trim(), 44);
      const tgt = truncateMiddle(s.translatedText.replace(/\s+/g, ' ').trim(), 44);
      lines.push(style.dim(`    ${src} → ${tgt}`));
      lines.push(style.dim(`      ${truncateMiddle(s.path, 76)}`));
    }
    lines.push('');
  }
  lines.push(
    `${input.command}: ${String(input.count)} consecutive source-identical translations for ${input.target} (latest: ${input.latestPath}). Continue? (Y/y = yes · N/n or Enter = stop)`,
  );
  return lines.join('\n');
}

export type IdentityStreakProgressHooks = {
  /**
   * Clears stderr progress and freezes timing while **`confirm`** runs (stderr when TTY, same stream as the bar).
   */
  pauseClock?: () => void;
  resumeClock?: () => void;
};

/** Friendly follow-up after the user stops at **`IdentityAbortError`** (issues still carry **`issues[]`** for machines). */
export function logIdentityStreakAbortNoWriteNotice(
  runCtx: Context,
  err: IdentityAbortError,
  opts: { dryRun: boolean; commandDisplay?: string },
): void {
  if (!canPrintInfo(runCtx.run)) return;
  const cmd = opts.commandDisplay ?? err.command;
  const fileNote = opts.dryRun ? 'dry-run made no file changes' : 'no locale files were written';
  logger.info(
    `${cmd}: stopped after identity-streak prompt — ${fileNote} for "${err.target}".`,
    runCtx.run,
  );
}

export function createIdentityStreakGuard(
  ctx: Context,
  command: string,
  target: string,
  hooks?: IdentityStreakProgressHooks,
): {
  onTranslated: (sourceText: string, translatedText: string, path: string) => Promise<void>;
  flushIssues: () => Issue[];
} {
  let state: IdentityStreakState = { consecutiveIdentity: 0, lastPath: '' };
  const issues: Issue[] = [];
  let recentIdentitySamples: IdentitySample[] = [];

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

      if (state.consecutiveIdentity < IDENTITY_STREAK_THRESHOLD) return;
      if (state.consecutiveIdentity % IDENTITY_STREAK_THRESHOLD !== 0) return;
      issues.push(
        buildIdentityStreakIssue({
          severity: 'warning',
          target,
          count: state.consecutiveIdentity,
          path: state.lastPath || path,
        }),
      );
      if (getCliYesFlag()) return;
      if (!canAsk(ctx.run)) {
        throw new IdentityAbortError(
          command,
          target,
          IDENTITY_STREAK_THRESHOLD,
          state.consecutiveIdentity,
          state.lastPath || path,
        );
      }
      hooks?.pauseClock?.();
      let ok = false;
      try {
        const message = buildIdentityStreakConfirmMessage({
          command,
          target,
          count: state.consecutiveIdentity,
          latestPath: state.lastPath || path,
          samples: recentIdentitySamples,
        });
        ok = await duringPrompt(() =>
          confirm({ message, default: false }, inquirerContextForIdentityPrompt()),
        );
      } catch (e) {
        if (e instanceof ExitPromptError) {
          if (canPrintInfo(ctx.run)) {
            logger.info(
              'identity-streak prompt cancelled (e.g. Ctrl+C) — translations stop here; nothing is written until a successful run.',
              ctx.run,
            );
          }
          if (typeof process !== 'undefined') process.exitCode ??= 130;
        }
        throw e;
      } finally {
        hooks?.resumeClock?.();
      }
      if (!ok) {
        throw new IdentityAbortError(
          command,
          target,
          IDENTITY_STREAK_THRESHOLD,
          state.consecutiveIdentity,
          state.lastPath || path,
        );
      }
    },
    flushIssues(): Issue[] {
      return issues.slice();
    },
  };
}
