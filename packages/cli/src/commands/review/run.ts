import { resolveContext } from '@/shared/context/index.js';
import { noopRunEmitter } from '@i18nprune/core';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope, buildCliJsonEnvelope } from '@i18nprune/core';
import { executeCore, runReviewJsonEnvelope, emptyReviewPayload } from '@/commands/review/jsonEnvelope.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';
import { logger } from '@/utils/logger/index.js';

/** Locale-level review: paths vs source, source-identical counts, structured leaf metadata when present. */
export async function review(opts: { target?: string }): Promise<void> {
  const wall = attachWallTimer();
  try {
    const runId = String(Date.now());
    const ctx = await resolveContext();
    const { run } = ctx;

    const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'review' });
    if (readiness) {
      if (run.json) {
        console.log(
          stringifyEnvelope(
            buildCliJsonEnvelope('review', emptyReviewPayload(ctx), {
              ok: false,
              issues: readiness,
              cwd: ctx.adapters.system.cwd(),
            }),
          ),
        );
        applyCliCiExitGate(false);
        return;
      }
      if (readiness[0]) logger.warn(readiness[0].message, run);
      printCommandSummary(
        {
          command: 'review',
          ok: false,
          durationMs: wall.elapsedMs(),
          counts: { localeFiles: 0, dynamic: 0, keyObservations: 0 },
          issues: readiness,
        },
        ctx,
      );
      applyCliCiExitGate(false);
      return;
    }

    if (run.json) {
      const { envelope } = runReviewJsonEnvelope(ctx, opts, { emit: noopRunEmitter, runId });
      console.log(stringifyEnvelope(envelope));
      applyCliCiExitGate(envelope.ok);
      return;
    }

    const listWindow = resolveCliListWindow(ctx.config);
    const { payload, envelope, keyObservationsCount } = executeCore(ctx, opts, {
      emit: createCliRunEmitter(run),
      runId,
      listLimit: listWindow.limit,
    });
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
    applyCliCiExitGate(envelope.ok);
  } finally {
    wall.dispose();
  }
}
