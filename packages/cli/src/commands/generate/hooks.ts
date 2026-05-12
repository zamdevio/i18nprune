/**
 * CLI flavor of {@link GenerateHostHooks}: TTY prompts, identity guard, and progress relay.
 *
 * Built once per **`generate`** invocation by **`run.ts`** and handed to the core **`runGenerate`**.
 * Other hosts (extension, web, workers, custom SDK consumers) implement the same shape with
 * their own progress / prompt strategies — core messages flow through `RunEmitter`.
 */

import { emitRunEvent, nowMs } from '@i18nprune/core';
import type { GenerateHostHooks, RunEvent } from '@i18nprune/core';

import { canAsk } from '@/shared/ask/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { rows, up } from '@/shared/cursor/index.js';
import { createSessionProgress } from '@/shared/progress/session.js';
import { createGenerateTickProgressRelay } from '@/shared/progress/tickRelay.js';
import {
  createIdentityStreakGuard,
  logIdentityStreakAbortNoWriteNotice,
} from '@/shared/translator/identity.js';

import {
  promptFullRetranslate,
  promptMetaLocaleDetails,
} from '@/commands/generate/prompts.js';
import {
  printGenerateFinalizeSummary,
  printPreserveParityReport,
} from '@/commands/generate/summary/index.js';

import type { Context } from '@/types/core/context/index.js';
import type { GenerateRuntime } from '@/types/command/generate/index.js';

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

    promptMetaLocaleDetails: (defaults) => promptMetaLocaleDetails(defaults, ctx.run),
    promptFullRetranslate,

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
