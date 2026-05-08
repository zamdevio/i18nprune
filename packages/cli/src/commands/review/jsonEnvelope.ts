import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import { computeReviewReport } from '@/shared/review/report.js';
import type { Context } from '@/types/core/context/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import type { ReviewJsonData, ReviewJsonOpts } from '@/types/command/review/json.js';
import { emitRunErrorFromUnknown, emitRunEvent, nowMs } from '@i18nprune/core';
import type { RunEmitter } from '@i18nprune/core';

export type { ReviewJsonOpts } from '@/types/command/review/json.js';

export function runReview(
  ctx: Context,
  opts: ReviewJsonOpts,
  runtime?: { emit?: RunEmitter; runId?: string },
): CliJsonEnvelope<'review', ReviewJsonData> {
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'review', runId: runtime?.runId, at: nowMs() });
  try {
    const { data, issues } = computeReviewReport(ctx, opts);
    const envelope = buildCliJsonEnvelope('review', data, {
      ok: true,
      issues,
      cwd: process.cwd(),
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.completed',
      op: 'review',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.summary',
      op: 'review',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: { locales: Object.keys(data.locales).length, dynamicKeySites: data.dynamicKeySites },
    });
    return envelope;
  } catch (err) {
    emitRunErrorFromUnknown(runtime?.emit, {
      op: 'review',
      runId: runtime?.runId,
      err,
      code: 'i18nprune.run.review_failed',
      recoverable: false,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.failed',
      op: 'review',
      runId: runtime?.runId,
      at: nowMs(),
      error: {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        recoverable: false,
      },
    });
    const empty: ReviewJsonData = {
      kind: 'localeReview',
      sourceLocale: '',
      localesDir: ctx.paths.localesDir,
      dynamicKeySites: 0,
      locales: {},
    };
    return buildIoReadFailureEnvelope('review', empty, ctx, err);
  }
}
