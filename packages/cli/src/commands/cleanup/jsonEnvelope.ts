import {
  buildCliJsonEnvelope,
  createCoreContext,
  emitRunErrorFromUnknown,
  emitRunEvent,
  nowMs,
  runCleanup as runCoreCleanup,
} from '@i18nprune/core';
import type { CleanupJsonOutput, CleanupRunOptions, CleanupRunResult, CliJsonEnvelope, RunEmitter } from '@i18nprune/core';

import { buildCleanupHostHooks } from '@/commands/cleanup/hooks.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { CleanupOptions, CleanupRuntime } from '@/types/command/cleanup/index.js';

export type CleanupJsonRunResult = CleanupRunResult & {
  envelope: CliJsonEnvelope<'cleanup', CleanupJsonOutput>;
};

export type CleanupJsonEnvelopeResult = {
  envelope: CliJsonEnvelope<'cleanup', CleanupJsonOutput>;
  result?: CleanupJsonRunResult;
};

export function toCleanupRunOptions(opts: CleanupOptions): CleanupRunOptions {
  return {
    checkOnly: opts.checkOnly,
    dryRun: opts.dryRun,
    skipStringPresenceCheck: opts.skipStringPresenceCheck ?? opts.skipRg,
  };
}

export function emptyCleanupPayload(): CleanupJsonOutput {
  return {
    wouldRemove: 0,
    keys: [],
    dynamicKeySites: 0,
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
    const coreCtx = createCoreContext({
      config: ctx.config,
      adapters: ctx.adapters,
      env: process.env,
      paths: ctx.paths,
      run: ctx.run,
    });
    const out = runCoreCleanup(coreCtx, toCleanupRunOptions(opts), buildCleanupHostHooks(ctx, runtime));
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
      counts: { wouldRemove: envelope.data.wouldRemove, dynamicKeySites: envelope.data.dynamicKeySites },
    });
    return { ...out, envelope };
  } catch (err) {
    emitCleanupFailureEvents(emit, runId, err);
    throw err;
  }
}

/** Same `cleanup --json` / `--check-only` payload (no writes). */
export function runCleanupJsonEnvelope(
  ctx: Context,
  opts: CleanupOptions,
  runtime?: CleanupRuntime,
): CleanupJsonEnvelopeResult {
  try {
    const result = executeCore(ctx, { ...opts, checkOnly: true, dryRun: true }, runtime ?? {});
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

