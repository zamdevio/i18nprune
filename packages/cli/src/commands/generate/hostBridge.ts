import { emitRunEvent, nowMs } from '@i18nprune/core';
import type { GenerateHostHooks } from '@i18nprune/core';
import type { RunEmitter, RunEvent } from '@i18nprune/core';
import { createGenerateTickProgressRelay } from '@/shared/progress/tickRelay.js';
import { createSessionProgress } from '@/shared/progress/session.js';
import {
  createIdentityStreakGuard,
  logIdentityStreakAbortNoWriteNotice,
} from '@/shared/translator/identity.js';
import {
  promptMetaLocaleDetails as promptMetaLocaleDetailsInteractive,
  printGenerateSessionBanner,
  promptFullRetranslate,
} from '@/commands/generate/prompts.js';
import {
  printGenerateFinalizeSummary,
  printPreserveParityReport,
} from '@/commands/generate/summary/index.js';
import { canAsk } from '@/shared/ask/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo, canPrintWarn } from '@/utils/logger/policy.js';
import { rows, up } from '@/shared/cursor/index.js';
import type { GenerateOptions } from '@/types/command/generate/index.js';
import type { Context } from '@/types/core/context/index.js';

export function buildGenerateHostHooks(
  ctx: Context,
  _merged: GenerateOptions,
  runtime?: { emit?: RunEmitter; runId?: string },
): GenerateHostHooks {
  const emit = runtime?.emit;
  const runId = runtime?.runId;
  const emitProgress = (
    e: Omit<Extract<RunEvent, { type: 'run.progress.generate' }>, 'op' | 'runId' | 'at'>,
  ): void => {
    emitRunEvent(emit, { op: 'generate', runId, at: nowMs(), ...e });
  };

  return {
    emitProgress,
    emit,
    runId,

    createSession: () => createSessionProgress({ quiet: ctx.run.quiet, json: ctx.run.json }),

    createIdentityStreakGuard: (target, clock) =>
      createIdentityStreakGuard(ctx, 'generate', target, clock),

    buildTickProgressRelay: ({ tick, target, translationMeta }) =>
      createGenerateTickProgressRelay({
        tick,
        emit,
        runId,
        target,
        translationMeta,
      }),

    beforeProviderFallbackWarn: () => {
      up(ctx.run, rows.gap);
    },

    log: {
      info: (msg) => {
        if (canPrintInfo(ctx.run)) logger.info(msg, ctx.run);
      },
      // Warn-styled hint that should still hide under `--quiet` (info policy, not warn policy).
      notice: (msg) => {
        if (canPrintInfo(ctx.run)) logger.warn(msg, ctx.run);
      },
      warn: (msg) => {
        if (canPrintWarn(ctx.run)) logger.warn(msg, ctx.run);
      },
    },

    shouldSkipInteractivePrompts: () => getCliYesFlag(),
    canAskInteractive: () => canAsk(ctx.run),

    promptMetaLocaleDetails: (defaults) => promptMetaLocaleDetailsInteractive(defaults, ctx.run),
    promptFullRetranslate,

    printSessionBanner: () => printGenerateSessionBanner(ctx.run),

    printPreserveParityReport: (preserve, parity) => printPreserveParityReport(preserve, parity, ctx.run),

    printFinalizeSummary: (input) =>
      printGenerateFinalizeSummary(
        {
          target: input.target,
          englishName: input.englishName,
          nativeName: input.nativeName,
          direction: input.direction,
          targetPath: input.targetPath,
          metaPath: input.metaPath,
          leafCount: input.leafCount,
          showMeta: input.showMeta,
          dryRun: input.dryRun,
        },
        ctx.run,
      ),

    onIdentityAbortNotice: (err, opts) =>
      logIdentityStreakAbortNoWriteNotice(ctx, err, {
        dryRun: opts.dryRun,
        commandDisplay: 'generate',
      }),
  };
}
