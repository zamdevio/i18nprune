import {
  buildCliJsonEnvelope,
  createCleanupLocaleWritePlan,
  emitRunErrorFromUnknown,
  emitRunEvent,
  nowMs,
  runCleanup as runCoreCleanup,
  writeCleanupPlan,
} from '@i18nprune/core';
import type { CliJsonEnvelope, CleanupJsonOutput, CleanupRunOptions, RunEmitter } from '@i18nprune/core';

import { buildCleanupHostHooks } from '@/commands/cleanup/hooks.js';
import { createCliCoreContext } from '@/shared/context/index.js';
import { buildIoReadFailureEnvelope, issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/index.js';
import type { Context } from '@/types/core/context/index.js';
import type {
  CleanupJsonEnvelopeResult,
  CleanupJsonRunResult,
  CleanupOptions,
  CleanupRuntime,
} from '@/types/command/cleanup/index.js';

export function toCleanupRunOptions(opts: CleanupOptions): CleanupRunOptions {
  return {
    dryRun: opts.dryRun === true,
    skipStringPresenceCheck: opts.skipStringPresenceCheck ?? opts.rg !== true,
    target: opts.target,
    top: opts.top,
    full: opts.full,
  };
}

export function emptyCleanupPayload(): CleanupJsonOutput {
  return {
    wouldRemove: 0,
    keys: [],
    dynamic: 0,
    dynamicActive: 0,
    dynamicCommented: 0,
    uncertainPrefixes: [],
  };
}

export function executeCore(
  ctx: Context,
  opts: CleanupOptions,
  runtime: CleanupRuntime = {},
): CleanupJsonRunResult {
  const { emit, runId } = runtime;
  emitRunEvent(emit, { type: 'run.started', op: 'cleanup', runId, at: nowMs() });
  try {
    const coreCtx = createCliCoreContext(ctx);
    const out = runCoreCleanup(
      coreCtx,
      toCleanupRunOptions(opts),
      buildCleanupHostHooks(ctx, runtime, { rg: opts.rg === true }),
    );
    const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), out.issues);
    const envelope = buildCliJsonEnvelope('cleanup', out.payload, {
      ok: true,
      issues,
      cwd: ctx.adapters.system.cwd(),
    });
    emitRunEvent(emit, {
      type: 'run.completed',
      op: 'cleanup',
      runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(emit, {
      type: 'run.summary',
      op: 'cleanup',
      runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: {
        wouldRemove: envelope.data.wouldRemove,
        dynamic: envelope.data.dynamicActive,
        ...(envelope.data.dynamicCommented > 0 ? { commented: envelope.data.dynamicCommented } : {}),
      },
    });
    return { ...out, envelope };
  } catch (err) {
    emitCleanupFailureEvents(emit, runId, err);
    throw err;
  }
}

/**
 * Write-capable cleanup: the same report as {@link executeCore}, plus the actual removals.
 *
 * The CLI applies cleanup writes only on the human path (`cleanup/run.ts`), so `--json` is
 * report-only. This entry is the reusable version of that human path without the prompts: it removes
 * every `safeToRemove` key from each locale slice and returns the written file paths. Confirmation is
 * the caller's concern — `serve` gates it behind `--allow-writes`.
 *
 * `dryRun` reports without writing (identical to the `--json` path).
 */
export function executeCleanupWrite(
  ctx: Context,
  opts: CleanupOptions,
  runtime: CleanupRuntime = {},
): { envelope: CliJsonEnvelope<'cleanup', CleanupJsonOutput>; writtenPaths: string[] } {
  const result = executeCore(ctx, opts, runtime);
  if (opts.dryRun === true) return { envelope: result.envelope, writtenPaths: [] };

  const coreCtx = createCliCoreContext(ctx);
  const writtenPaths: string[] = [];
  for (const slice of result.localeSlices) {
    if (slice.safeToRemove.length === 0) continue;
    const plan = createCleanupLocaleWritePlan(coreCtx, slice.localeCode, slice.safeToRemove);
    writeCleanupPlan(coreCtx, plan);
    writtenPaths.push(...plan.writes.map((write) => write.sourcePath));
  }
  return { envelope: result.envelope, writtenPaths };
}


export function runCleanupJsonEnvelope(
  ctx: Context,
  opts: CleanupOptions,
  runtime?: CleanupRuntime,
): CleanupJsonEnvelopeResult {
  try {
    const result = executeCore(ctx, opts, runtime ?? {});
    return { envelope: result.envelope, result };
  } catch (err) {
    return { envelope: buildIoReadFailureEnvelope('cleanup', emptyCleanupPayload(), ctx, err) };
  }
}

function emitCleanupFailureEvents(emit: RunEmitter | undefined, runId: string | undefined, err: unknown): void {
  emitRunErrorFromUnknown(emit, {
    op: 'cleanup',
    runId,
    err,
    code: 'i18nprune.run.cleanup_failed',
    recoverable: false,
  });
  emitRunEvent(emit, {
    type: 'run.failed',
    op: 'cleanup',
    runId,
    at: nowMs(),
    error: {
      name: err instanceof Error ? err.name : 'Error',
      message: err instanceof Error ? err.message : String(err),
      recoverable: false,
    },
  });
}

