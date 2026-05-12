import { ExitPromptError } from '@inquirer/core';
import { confirm } from '@inquirer/prompts';
import {
  IdentityAbortError,
  createIdentityStreakGuard as createCoreIdentityStreakGuard,
  type IdentityStreakConfirmInput,
  type IdentityStreakGuard,
  type IdentitySample,
} from '@i18nprune/core';
import { canAsk } from '@/shared/ask/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { truncateMiddle } from '@/shared/progress/index.js';
import { style } from '@/utils/style/index.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import { logger } from '@/utils/logger/index.js';
import { duringPrompt } from '@/utils/timer/index.js';
import type { Context } from '@/types/core/context/index.js';

export type IdentityStreakProgressHooks = {
  /**
   * Clears stderr progress and freezes timing while **`confirm`** runs (stderr when TTY, same stream as the bar).
   */
  pauseClock?: () => void;
  resumeClock?: () => void;
};

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
    `${input.command}: ${String(input.count)} consecutive source-identical translations for ${input.target} (latest: ${input.latestPath}). Continue? (Y/y or Enter = continue · N/n = stop)`,
  );
  return lines.join('\n');
}

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

/**
 * CLI-host wrapper around the pure {@link createCoreIdentityStreakGuard core guard}.
 *
 * Behavior matrix (host policy):
 * - **`--json` / `--yes` / non-TTY** → no prompt; warning issue still emitted; run continues.
 * - **interactive TTY** → inquirer `confirm` with **default `Y` (Enter = continue)**, `N` stops.
 *
 * Aborting the run on a streak is now an *explicit* user "no", not an environmental default
 * (aligns with `translate-policy.md` D9: run never aborts because of one leaf).
 */
export function createIdentityStreakGuard(
  ctx: Context,
  command: string,
  target: string,
  hooks?: IdentityStreakProgressHooks,
): IdentityStreakGuard {
  return createCoreIdentityStreakGuard({
    command,
    target,
    interactive: () => canAsk(ctx.run) && !getCliYesFlag(),
    confirm: async (input: IdentityStreakConfirmInput): Promise<boolean> => {
      hooks?.pauseClock?.();
      try {
        const message = buildIdentityStreakConfirmMessage(input);
        return await duringPrompt(() =>
          confirm({ message, default: true }, inquirerContextForIdentityPrompt()),
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
    },
  });
}
