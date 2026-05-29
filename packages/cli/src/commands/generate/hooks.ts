/**
 * CLI flavor of {@link GenerateHostHooks}: TTY prompts, identity guard, and progress relay.
 *
 * Built once per **`generate`** invocation by **`run.ts`** and handed to the core **`runGenerate`**.
 * Other hosts (extension, web, workers, custom SDK consumers) implement the same shape with
 * their own progress / prompt strategies — core messages flow through `RunEmitter`.
 */

import {
  emitRunEvent,
  formatGenerateFinalizeSummaryLines,
  getRunOptions,
  nowMs,
} from '@i18nprune/core';
import type { GenerateFinalizeSummaryInput, GenerateHostHooks, RunEvent, RunOptions } from '@i18nprune/core';

import { canAsk } from '@/shared/ask/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { rows, up } from '@/shared/cursor/index.js';
import { createGenerateTickProgressRelay, createSessionProgress } from '@/shared/progress/index.js';
import {
  createIdentityStreakGuard,
  logIdentityStreakAbortNoWriteNotice,
} from '@/shared/translator/identity.js';
import { joinMetaSubtitle } from '@/utils/ansi/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintDetail, canPrintInfo } from '@/utils/logger/policy.js';

import { promptFullRetranslate, promptPartialTargetGenerate } from '@/commands/generate/prompts.js';

import type { Context } from '@/types/core/context/index.js';
import type { GenerateRuntime } from '@/types/command/generate/index.js';

function printPreserveParityReport(
  preserveCount: number,
  paritySkip: number,
  run?: RunOptions,
): void {
  const r = run ?? getRunOptions();
  if (!canPrintDetail(r)) return;
  if (preserveCount > 0) {
    logger.detail(`  Preserved (verbatim from source): ${String(preserveCount)}`, r);
  }
  if (paritySkip > 0) {
    logger.detail(`  Skipped (parity policy): ${String(paritySkip)}`, r);
  }
}

function printGenerateFinalizeSummary(opts: GenerateFinalizeSummaryInput, run?: RunOptions): void {
  const r = run ?? getRunOptions();
  const localeSubtitle =
    opts.localeSubtitle ?? joinMetaSubtitle(opts.target, opts.englishName, opts.nativeName, opts.direction);
  if (!canPrintInfo(r)) return;
  for (const line of formatGenerateFinalizeSummaryLines({ ...opts, localeSubtitle })) {
    logger.info(line, r);
  }
}

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

    shouldSkipInteractivePrompts: () => getCliYesFlag(),
    canAskInteractive: () => canAsk(ctx.run),

    promptFullRetranslate,
    promptPartialTargetGenerate,

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
