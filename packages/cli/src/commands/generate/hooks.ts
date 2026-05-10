/**
 * CLI flavor of {@link GenerateHostHooks}: TTY prompts, identity guard, progress relay, logger policy.
 *
 * Built once per **`generate`** invocation by **`run.ts`** and handed to the core **`runGenerate`**.
 * Other hosts (extension, web, workers, custom SDK consumers) implement the same shape but with
 * their own logger / progress / prompt strategies — core stays runtime-agnostic.
 */

import { emitRunEvent, nowMs } from '@i18nprune/core';
import type { GenerateHostHooks, RunEmitter, RunEvent } from '@i18nprune/core';

import { canAsk } from '@/shared/ask/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { rows, up } from '@/shared/cursor/index.js';
import { createSessionProgress } from '@/shared/progress/session.js';
import { createGenerateTickProgressRelay } from '@/shared/progress/tickRelay.js';
import {
  createIdentityStreakGuard,
  logIdentityStreakAbortNoWriteNotice,
} from '@/shared/translator/identity.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo, canPrintWarn } from '@/utils/logger/policy.js';

import {
  printGenerateSessionBanner,
  promptFullRetranslate,
  promptMetaLocaleDetails,
} from '@/commands/generate/prompts.js';
import {
  printGenerateFinalizeSummary,
  printPreserveParityReport,
} from '@/commands/generate/summary/index.js';

import type { Context } from '@/types/core/context/index.js';

export type GenerateRuntime = { emit?: RunEmitter; runId?: string };

export function buildGenerateHostHooks(ctx: Context, runtime: GenerateRuntime): GenerateHostHooks {
  const { emit, runId } = runtime;
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
      createGenerateTickProgressRelay({ tick, emit, runId, target, translationMeta }),

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

    promptMetaLocaleDetails: (defaults) => promptMetaLocaleDetails(defaults, ctx.run),
    promptFullRetranslate,

    printSessionBanner: () => printGenerateSessionBanner(ctx.run),

    printPreserveParityReport: (preserve, parity) =>
      printPreserveParityReport(preserve, parity, ctx.run),

    printFinalizeSummary: (input) => printGenerateFinalizeSummary(input, ctx.run),

    onIdentityAbortNotice: (err, opts) =>
      logIdentityStreakAbortNoWriteNotice(ctx, err, {
        dryRun: opts.dryRun,
        commandDisplay: 'generate',
      }),
  };
}
