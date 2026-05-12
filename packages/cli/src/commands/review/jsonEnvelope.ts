import {
  buildCliJsonEnvelope,
  createCoreContext,
  emitRunErrorFromUnknown,
  emitRunEvent,
  nowMs,
  runReview as runCoreReview,
} from '@i18nprune/core';
import type { CliJsonEnvelope, ReviewJsonData, ReviewRunOptions, ReviewRunResult, RunEmitter } from '@i18nprune/core';
import type { ReviewRuntime } from '@/types/command/review/index.js';

import { buildReviewHostHooks } from '@/commands/review/hooks.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';

export type ReviewJsonRunResult = ReviewRunResult & {
  envelope: CliJsonEnvelope<'review', ReviewJsonData>;
};

export type ReviewJsonEnvelopeResult = {
  envelope: CliJsonEnvelope<'review', ReviewJsonData>;
  result?: ReviewJsonRunResult;
};

export function emptyReviewPayload(ctx: Context): ReviewJsonData {
  return {
    kind: 'localeReview',
    sourceLocale: '',
    localesDir: ctx.paths.localesDir,
    dynamicKeySites: 0,
    locales: {},
  };
}

export function executeCore(ctx: Context, opts: ReviewRunOptions, runtime: ReviewRuntime = {}): ReviewJsonRunResult {
  const coreCtx = createCoreContext({
    config: ctx.config,
    adapters: ctx.adapters,
    env: process.env,
    paths: ctx.paths,
    run: ctx.run,
  });
  const out = runCoreReview(coreCtx, opts, buildReviewHostHooks(ctx, runtime));
  const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), out.issues);
  const envelope = buildCliJsonEnvelope('review', out.payload, {
    ok: true,
    issues,
    cwd: ctx.adapters.system.cwd(),
  });
  return { ...out, envelope };
}

/** `--json` mode wrapper: returns a stable envelope and keeps `runReview` reserved for core. */
export function runReviewJsonEnvelope(
  ctx: Context,
  opts: ReviewRunOptions,
  runtime?: ReviewRuntime,
): ReviewJsonEnvelopeResult {
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'review', runId: runtime?.runId, at: nowMs() });
  try {
    const result = executeCore(ctx, opts, runtime);
    emitRunEvent(runtime?.emit, {
      type: 'run.completed',
      op: 'review',
      runId: runtime?.runId,
      at: nowMs(),
      ok: result.envelope.ok,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.summary',
      op: 'review',
      runId: runtime?.runId,
      at: nowMs(),
      ok: result.envelope.ok,
      issueCount: result.envelope.issues.length,
      counts: { locales: Object.keys(result.payload.locales).length, dynamicKeySites: result.payload.dynamicKeySites },
    });
    return { envelope: result.envelope, result };
  } catch (err) {
    emitReviewFailureEvents(runtime?.emit, runtime?.runId, err);
    return { envelope: buildIoReadFailureEnvelope('review', emptyReviewPayload(ctx), ctx, err) };
  }
}

function emitReviewFailureEvents(emit: RunEmitter | undefined, runId: string | undefined, err: unknown): void {
  emitRunErrorFromUnknown(emit, {
    op: 'review',
    runId,
    err,
    code: 'i18nprune.run.review_failed',
    recoverable: false,
  });
  emitRunEvent(emit, {
    type: 'run.failed',
    op: 'review',
    runId,
    at: nowMs(),
    error: {
      name: err instanceof Error ? err.name : 'Error',
      message: err instanceof Error ? err.message : String(err),
      recoverable: false,
    },
  });
}
