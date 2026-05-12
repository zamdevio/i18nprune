import {
  buildCliJsonEnvelope,
  createCoreContext,
  emitRunErrorFromUnknown,
  emitRunEvent,
  nowMs,
  runMissing as runCoreMissing,
} from '@i18nprune/core';
import type { CliJsonEnvelope, MissingJsonOutput, MissingRunOptions, MissingRunResult, RunEmitter } from '@i18nprune/core';
import type { MissingRuntime } from '@/types/command/missing/index.js';

import { buildMissingHostHooks } from '@/commands/missing/hooks.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';

export type MissingJsonRunResult = MissingRunResult & {
  envelope: CliJsonEnvelope<'missing', MissingJsonOutput>;
};

export type MissingJsonEnvelopeResult = {
  envelope: CliJsonEnvelope<'missing', MissingJsonOutput>;
  result?: MissingJsonRunResult;
};

export function emptyMissingPayload(opts: MissingRunOptions): MissingJsonOutput {
  return {
    kind: 'missing',
    targetPath: '',
    targetKind: 'source',
    pathsAdded: 0,
    paths: [],
    dryRun: Boolean(opts.dryRun),
    skippedNotInScan: [],
    targets: [],
    skippedTargets: [],
  };
}

export function executeCore(
  ctx: Context,
  opts: MissingRunOptions,
  runtime: MissingRuntime = {},
): MissingJsonRunResult {
  const coreCtx = createCoreContext({
    config: ctx.config,
    adapters: ctx.adapters,
    env: process.env,
    paths: ctx.paths,
    run: ctx.run,
  });
  const out = runCoreMissing(coreCtx, opts, buildMissingHostHooks(ctx, runtime));
  const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), out.issues);
  const envelope = buildCliJsonEnvelope('missing', out.payload, {
    ok: true,
    issues,
    cwd: ctx.adapters.system.cwd(),
  });
  return { ...out, envelope };
}

/** `--json` mode wrapper: returns a stable envelope and keeps `runMissing` reserved for core. */
export function runMissingJsonEnvelope(
  ctx: Context,
  opts: MissingRunOptions,
  runtime?: MissingRuntime,
): MissingJsonEnvelopeResult {
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'missing', runId: runtime?.runId, at: nowMs() });
  try {
    const result = executeCore(ctx, opts, runtime);
    emitRunEvent(runtime?.emit, {
      type: 'run.completed',
      op: 'missing',
      runId: runtime?.runId,
      at: nowMs(),
      ok: result.envelope.ok,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.summary',
      op: 'missing',
      runId: runtime?.runId,
      at: nowMs(),
      ok: result.envelope.ok,
      issueCount: result.envelope.issues.length,
      counts: {
        pathsAdded: result.payload.pathsAdded,
        targets: result.payload.targets.length,
        skippedTargets: result.payload.skippedTargets.length,
      },
    });
    return { envelope: result.envelope, result };
  } catch (err) {
    emitMissingFailureEvents(runtime?.emit, runtime?.runId, err);
    return { envelope: buildIoReadFailureEnvelope('missing', emptyMissingPayload(opts), ctx, err) };
  }
}

function emitMissingFailureEvents(emit: RunEmitter | undefined, runId: string | undefined, err: unknown): void {
  emitRunErrorFromUnknown(emit, {
    op: 'missing',
    runId,
    err,
    code: 'i18nprune.run.missing_failed',
    recoverable: false,
  });
  emitRunEvent(emit, {
    type: 'run.failed',
    op: 'missing',
    runId,
    at: nowMs(),
    error: {
      name: err instanceof Error ? err.name : 'Error',
      message: err instanceof Error ? err.message : String(err),
      recoverable: false,
    },
  });
}
