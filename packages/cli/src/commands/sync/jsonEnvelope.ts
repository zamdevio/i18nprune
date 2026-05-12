import {
  buildCliJsonEnvelope,
  createCoreContext,
  emitRunErrorFromUnknown,
  emitRunEvent,
  nowMs,
  runSync as runCoreSync,
} from '@i18nprune/core';
import type { CliJsonEnvelope, RunEmitter, SyncJsonOutput, SyncRunOptions, SyncRunResult } from '@i18nprune/core';

import { buildSyncHostHooks } from '@/commands/sync/hooks.js';
import type { SyncRuntime } from '@/types/command/sync/index.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/cliEnvelopeIssues.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import type { Context } from '@/types/core/context/index.js';

export type SyncJsonRunResult = SyncRunResult & {
  envelope: CliJsonEnvelope<'sync', SyncJsonOutput>;
};

export type SyncJsonEnvelopeResult = {
  envelope: CliJsonEnvelope<'sync', SyncJsonOutput>;
  result?: SyncJsonRunResult;
};

export function emptySyncPayload(ctx: Context, opts: { dryRun?: boolean }): SyncJsonOutput {
  return {
    kind: 'sync',
    sourcePath: ctx.paths.sourceLocale,
    localesDir: ctx.paths.localesDir,
    targetFiles: 0,
    writtenFiles: 0,
    dynamicKeySites: 0,
    dryRun: Boolean(opts.dryRun),
    files: [],
  };
}

export function executeCore(
  ctx: Context,
  opts: SyncRunOptions,
  runtime: SyncRuntime,
): SyncJsonRunResult {
  const { emit, runId } = runtime;
  emitRunEvent(emit, { type: 'run.started', op: 'sync', runId, at: nowMs() });
  try {
    const coreCtx = createCoreContext({
      config: ctx.config,
      adapters: ctx.adapters,
      env: process.env,
      paths: ctx.paths,
      run: ctx.run,
    });
    const out = runCoreSync(coreCtx, opts, buildSyncHostHooks(ctx, runtime));
    const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), out.issues);
    const envelope = buildCliJsonEnvelope('sync', out.payload, {
      ok: true,
      issues,
      cwd: ctx.adapters.system.cwd(),
    });

    emitRunEvent(emit, {
      type: 'run.completed',
      op: 'sync',
      runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(emit, {
      type: 'run.summary',
      op: 'sync',
      runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: {
        targets: out.targets.length,
        written: out.updated,
        dynamicKeySites: out.dynamicSites.length,
      },
    });
    return { ...out, envelope };
  } catch (err) {
    emitSyncFailureEvents(emit, runId, err);
    throw err;
  }
}

/** `--json` mode wrapper: returns a stable envelope and keeps `runSync` reserved for core. */
export function runSyncJsonEnvelope(
  ctx: Context,
  opts: SyncRunOptions,
  runtime?: SyncRuntime,
): SyncJsonEnvelopeResult {
  try {
    const result = executeCore(ctx, opts, runtime ?? {});
    return { envelope: result.envelope, result };
  } catch (err) {
    return { envelope: buildIoReadFailureEnvelope('sync', emptySyncPayload(ctx, opts), ctx, err) };
  }
}

function emitSyncFailureEvents(emit: RunEmitter | undefined, runId: string | undefined, err: unknown): void {
  emitRunErrorFromUnknown(emit, {
    op: 'sync',
    runId,
    err,
    code: 'i18nprune.run.sync_failed',
    recoverable: false,
  });
  emitRunEvent(emit, {
    type: 'run.failed',
    op: 'sync',
    runId,
    at: nowMs(),
    error: {
      name: err instanceof Error ? err.name : 'Error',
      message: err instanceof Error ? err.message : String(err),
      recoverable: false,
    },
  });
}
