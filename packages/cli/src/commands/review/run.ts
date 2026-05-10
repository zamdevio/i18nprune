import { resolveContext } from '@/shared/context/index.js';
import { formatCountMap, noopRunEmitter, parseReviewTargetCodes } from '@i18nprune/core';
import { formatReviewLocaleHeading } from '@/shared/review/humanLog.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@/shared/result/cliJson.js';
import { runReview } from '@/commands/review/jsonEnvelope.js';
import { logger } from '@/utils/logger/index.js';
import { attachWallTimer } from '@/utils/timer/index.js';
import { canPrintWarn } from '@/utils/logger/policy.js';
import type { ReviewLocaleStats } from '@/types/command/review/json.js';
import type { RunOptions } from '@/types/core/runtime/index.js';
import { resolveExtractionBaselineCounts, resolveReviewData } from '@/shared/cache/index.js';

function humanLocaleBlock(v: ReviewLocaleStats, run: RunOptions): void {
  if (v.structuredLeaves === 0) {
    logger.info(
      `Leaves: ${String(v.stringPaths)} · source-identical: ${String(v.englishIdentical)} — all plain-string leaves (no structured \`{ value, … }\` metadata at paths yet).`,
      run,
    );
  } else {
    logger.info(
      `Leaves: ${String(v.stringPaths)} · source-identical: ${String(v.englishIdentical)} · needsReview: true ${String(v.needsReviewTrue)} · false ${String(v.needsReviewFalse)} · unset ${String(v.needsReviewUnset)}`,
      run,
    );
  }
  logger.info(
    `Shape: legacy strings ${String(v.legacyLeaves)} · structured ${String(v.structuredLeaves)}`,
    run,
  );

  if (v.structuredLeaves > 0) {
    const { none, low, mid, high } = v.confidenceBuckets;
    logger.info(
      `Confidence: none ${String(none)} · <0.5 ${String(low)} · 0.5–0.85 ${String(mid)} · 0.85+ ${String(high)}`,
      run,
    );
    const statusLine = formatCountMap(v.byStatus);
    const sourceLine = formatCountMap(v.bySource);
    logger.info(`By status: ${statusLine || '—'}`, run);
    logger.info(`By source: ${sourceLine || '—'}`, run);
    const missNr = v.structuredLeavesMissingNeedsReview;
    const missConf = v.structuredLeavesMissingConfidence;
    if (missNr > 0 || missConf > 0) {
      logger.info(
        `Structured metadata gaps: needsReview missing/invalid on ${String(missNr)} leaf(es) · confidence missing/null/invalid on ${String(missConf)} leaf(es) (optional fields; validate does not flag these yet).`,
        run,
      );
    }
  }

  if (v.legacyLeaves > 0 && v.structuredLeaves > 0) {
    logger.warn(
      `${String(v.legacyLeaves)} plain-string leaf(es) coexist with structured leaves — sync, generate, and fill still write string-shaped values at template paths today, so rich metadata is not applied there until a shared structured writer lands.`,
      run,
    );
  }
}

/** Locale-level review: paths vs source, source-identical counts, structured leaf metadata when present. */
export async function review(opts: { target?: string }): Promise<void> {
  const wall = attachWallTimer();
  try {
    const runId = String(Date.now());
    const ctx = await resolveContext();
    const { run } = ctx;

    if (run.json) {
      const envelope = runReview(ctx, opts, { emit: noopRunEmitter, runId });
      console.log(stringifyEnvelope(envelope));
      if (!envelope.ok) {
        process.exitCode = 1;
      }
      return;
    }

    const { data, issues } = resolveReviewData(ctx, opts);
    const { locales, dynamicKeySites, sourceLocale } = data;
    const targetCodes = parseReviewTargetCodes(opts.target);
    const scopeLabel =
      targetCodes === undefined ? 'all non-source locales' : `locales: ${targetCodes.join(', ')}`;

    logger.info(
      `Source locale: ${sourceLocale} · scope: ${scopeLabel} · files in this run: ${String(Object.keys(locales).length)}`,
      run,
    );
    logger.info(
      'Reads plain string leaves and structured `{ value, status?, confidence?, needsReview?, source? }` terminals; nested objects without `value` are traversed.',
      run,
    );

    if (dynamicKeySites > 0 && canPrintWarn(run)) {
      logger.warn(
        `${String(dynamicKeySites)} translation call(s) use a non-literal key — run \`i18nprune validate\` or \`i18nprune locales dynamic\` for file:line samples.`,
        run,
      );
    }

    for (const [f, v] of Object.entries(locales)) {
      logger.decorative.blank(run);
      logger.info(formatReviewLocaleHeading(f), run);
      humanLocaleBlock(v, run);
    }

    const anyIdentical = Object.values(locales).some((v) => v.englishIdentical > 0);
    if (anyIdentical) {
      logger.decorative.blank(run);
      logger.info(
        'Tip: source-identical leaves match the source locale string at the same path — use fill or generate to refresh translations.',
        run,
      );
    }

    printCommandSummary(
      {
        command: 'review',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: { localeFiles: Object.keys(locales).length, ...resolveExtractionBaselineCounts(ctx) },
        issues,
      },
      ctx,
    );
  } finally {
    wall.dispose();
  }
}
