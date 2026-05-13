import { resolveContext } from '@/shared/context/index.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@i18nprune/core';
import { executeCore, runQualityJsonEnvelope } from '@/commands/quality/jsonEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromQualityEnglishIdentical,
  mergeIssues,
} from '@/shared/result/index.js';
import { noopRunEmitter } from '@i18nprune/core';
import type { QualityOptions } from '@/types/command/quality/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { createCliRunEmitter } from '@/shared/run/renderRunEvent.js';
import { applyCliCiExitGate } from '@/shared/cli/ciExitGate.js';

export async function quality(opts: QualityOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const runId = String(Date.now());

    if (ctx.run.json) {
      const { envelope } = runQualityJsonEnvelope(ctx, opts, { emit: noopRunEmitter, runId });
      console.log(stringifyEnvelope(envelope));
      applyCliCiExitGate(envelope.ok);
      return;
    }

    const { payload, keyObservationsCount, envelope } = executeCore(ctx, opts, { emit: createCliRunEmitter(ctx.run), runId });
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
