import { resolveContext } from '@/shared/context/index.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope, buildCliJsonEnvelope, noopRunEmitter } from '@i18nprune/core';
import { executeCore, runQualityJsonEnvelope, emptyQualityPayload } from '@/commands/quality/jsonEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromQualityEnglishIdentical,
  mergeIssues,
} from '@/shared/result/index.js';
import type { QualityOptions } from '@/types/command/quality/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';
import { cliReadinessIssues } from '@/shared/project/index.js';
import { resolveCliListWindow } from '@/shared/context/listWindow.js';

export async function quality(opts: QualityOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const runId = String(Date.now());

    const readiness = cliReadinessIssues(ctx, { mode: 'preset', preset: 'quality' });
    if (readiness) {
      if (ctx.run.json) {
        console.log(
          stringifyEnvelope(
            buildCliJsonEnvelope('quality', emptyQualityPayload(), {
              ok: false,
              issues: readiness,
              cwd: ctx.adapters.system.cwd(),
            }),
          ),
        );
        applyCliCiExitGate(false);
        return;
      }
      printCommandSummary(
        {
          command: 'quality',
          ok: false,
          durationMs: wall.elapsedMs(),
          counts: { total: 0, dynamic: 0, keyObservations: 0 },
          issues: readiness,
        },
        ctx,
      );
      applyCliCiExitGate(false);
      return;
    }

    if (ctx.run.json) {
      const { envelope } = runQualityJsonEnvelope(ctx, opts, { emit: noopRunEmitter, runId });
      console.log(stringifyEnvelope(envelope));
      applyCliCiExitGate(envelope.ok);
      return;
    }

    const listWindow = resolveCliListWindow(ctx.config);
    const { payload, keyObservationsCount, envelope } = executeCore(ctx, opts, {
      emit: createCliRunEmitter(ctx.run),
      runId,
      listLimit: listWindow.limit,
    });
    const { total, dynamicKeySites } = payload;
    const summaryIssues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      issuesFromDynamicScanCount(dynamicKeySites),
      issuesFromQualityEnglishIdentical(total),
    );
    printCommandSummary(
      {
        command: 'quality',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: { total, dynamic: dynamicKeySites, keyObservations: keyObservationsCount },
        issues: summaryIssues,
      },
      ctx,
    );
    applyCliCiExitGate(envelope.ok);
  } finally {
    wall.dispose();
  }
}
