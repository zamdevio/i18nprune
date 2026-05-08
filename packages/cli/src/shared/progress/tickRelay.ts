import { emitRunEvent, nowMs, type RunEmitter, type TranslationTickProgressFn } from '@i18nprune/core';
import type { TranslationProgress } from '@/types/core/progress/index.js';
import type { TranslationProviderId } from '@i18nprune/core';

/** JSON stream cadence for per-tick translate progress (start, every Nth, completion). */
const TRANSLATE_TICK_JSON_INTERVAL = 50;

function shouldEmitThrottledTranslateProgressJson(i: number, total: number): boolean {
  return i === 1 || i === total || i % TRANSLATE_TICK_JSON_INTERVAL === 0;
}

/**
 * Maps core **`tickProgress`** to session TTY + throttled **`run.progress.generate`** events.
 */
export function createGenerateTickProgressRelay(input: {
  tick: TranslationProgress['tick'];
  emit?: RunEmitter;
  runId?: string | undefined;
  target: string;
  translationMeta: { providerId: TranslationProviderId; translationModel?: string };
}): TranslationTickProgressFn {
  return (i, total, label, opts) => {
    input.tick(i, total, label, opts);
    if (!input.emit) return;
    if (shouldEmitThrottledTranslateProgressJson(i, total)) {
      emitRunEvent(input.emit, {
        op: 'generate',
        runId: input.runId,
        at: nowMs(),
        type: 'run.progress.generate',
        phase: 'translate',
        target: input.target,
        current: i,
        total,
        label,
        ...input.translationMeta,
      });
    }
  };
}

/**
 * Maps core **`tickProgress`** to session TTY + throttled **`run.progress.fill`** events (translate phase).
 */
export function createFillTickProgressRelay(input: {
  tick: TranslationProgress['tick'];
  emit?: RunEmitter;
  runId?: string | undefined;
  target: string;
  translationMeta: { providerId: TranslationProviderId; translationModel?: string };
}): TranslationTickProgressFn {
  return (i, total, label, opts) => {
    input.tick(i, total, label, opts);
    if (!input.emit) return;
    if (shouldEmitThrottledTranslateProgressJson(i, total)) {
      emitRunEvent(input.emit, {
        op: 'fill',
        runId: input.runId,
        at: nowMs(),
        type: 'run.progress.fill',
        phase: 'translate',
        target: input.target,
        current: i,
        total,
        label,
        ...input.translationMeta,
      });
    }
  };
}
