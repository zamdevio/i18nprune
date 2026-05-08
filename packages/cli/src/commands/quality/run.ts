import { resolveContext } from '@/shared/context/index.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@/shared/result/cliJson.js';
import { runQuality } from '@/commands/quality/jsonEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromQualityEnglishIdentical,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { logger } from '@/utils/logger/index.js';
import { noopRunEmitter } from '@i18nprune/core';
import type { QualityOptions } from '@/types/command/quality/index.js';
import { resolveQualityData } from '@/shared/cache/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { canPrintWarn } from '@/utils/logger/policy.js';

export async function quality(opts: QualityOptions): Promise<void> {
  const wall = attachWallTimer();
  try {
    const ctx = await resolveContext();
    const runId = String(Date.now());

    if (ctx.run.json) {
      const envelope = runQuality(ctx, opts, { emit: noopRunEmitter, runId });
      console.log(stringifyEnvelope(envelope));
      if (!envelope.ok) {
        process.exitCode = 1;
      }
      return;
    }

    const { total, perFile, dynamicKeySites } = resolveQualityData(ctx, opts);

    logger.info(
      `Source-identical leaves (target value still equals source locale at path): ${String(total)}`,
      ctx.run,
    );
    for (const [f, c] of Object.entries(perFile)) {
      if (c > 0) logger.detail(`  ${f}: ${String(c)}`, ctx.run);
    }
    if (dynamicKeySites > 0 && canPrintWarn(ctx.run)) {
      logger.warn(
        `${String(dynamicKeySites)} translation call(s) use a non-literal key — separate from the source-identical parity count above; use \`validate\` or \`locales dynamic\` for samples.`,
        ctx.run,
      );
    }
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
        counts: { total, dynamicKeySites },
        issues: summaryIssues,
      },
      ctx,
    );
  } finally {
    wall.dispose();
  }
}
