import { resolveContext } from '@/shared/context/index.js';
import { noopRunEmitter } from '@i18nprune/core';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@i18nprune/core';
import { executeCore, runReviewJsonEnvelope } from '@/commands/review/jsonEnvelope.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';

/** Locale-level review: paths vs source, source-identical counts, structured leaf metadata when present. */
export async function review(opts: { target?: string }): Promise<void> {
  const wall = attachWallTimer();
  try {
    const runId = String(Date.now());
    const ctx = await resolveContext();
    const { run } = ctx;

    if (run.json) {
      const { envelope } = runReviewJsonEnvelope(ctx, opts, { emit: noopRunEmitter, runId });
      console.log(stringifyEnvelope(envelope));
      if (!envelope.ok) {
        process.exitCode = 1;
      }
      return;
    }

    const { payload, envelope, keyObservationsCount } = executeCore(ctx, opts, { emit: createCliRunEmitter(run), runId });
    const { locales } = payload;

    printCommandSummary(
      {
        command: 'review',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: {
          localeFiles: Object.keys(locales).length,
          dynamic: payload.dynamicKeySites,
          keyObservations: keyObservationsCount,
        },
        issues: envelope.issues,
      },
      ctx,
    );
  } finally {
    wall.dispose();
  }
}
