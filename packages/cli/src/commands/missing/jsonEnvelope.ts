import {
  buildCliJsonEnvelope,
  emitRunErrorFromUnknown,
  emitRunEvent,
  nowMs,
  runMissing as runCoreMissing,
  writeMissingPaths,
  resolveMissingLeafPlaceholder,
} from '@i18nprune/core';
import type { MissingJsonOutput, MissingRunOptions, RunEmitter } from '@i18nprune/core';
import type {
  MissingJsonEnvelopeOptions,
  MissingJsonEnvelopeResult,
  MissingJsonRunResult,
  MissingRuntime,
} from '@/types/command/missing/index.js';

import { buildMissingHostHooks } from '@/commands/missing/hooks.js';
import { createCliCoreContext } from '@/shared/context/index.js';
import { buildIoReadFailureEnvelope, issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/index.js';
import type { Context } from '@/types/core/context/index.js';

export function emptyMissingPayload(opts: MissingRunOptions): MissingJsonOutput {
  return {
    kind: 'missing',
    targetPath: '',
    targetKind: 'source',
    pathsAdded: 0,
    shown: 0,
    top: opts.full === true ? null : (opts.top ?? 10),
    full: opts.full === true,
    paths: [],
    dryRun: Boolean(opts.dryRun),
    skippedNotInScan: [],
    targets: [],
    skippedTargets: [],
    placeholderLeaves: {
      count: 0,
      shown: 0,
      top: opts.full === true ? null : (opts.top ?? 10),
      full: opts.full === true,
      leaves: [],
    },
  };
}

export function executeCore(
  ctx: Context,
  opts: MissingRunOptions,
  runtime: MissingRuntime = {},
): MissingJsonRunResult {
  const coreCtx = createCliCoreContext(ctx);
  const out = runCoreMissing(coreCtx, opts, buildMissingHostHooks(runtime));
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
  jsonOpts: MissingJsonEnvelopeOptions = {},
): MissingJsonEnvelopeResult {
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'missing', runId: runtime?.runId, at: nowMs() });
  try {
    const result = executeCore(ctx, opts, runtime);
    if (jsonOpts.applyWrites === true && opts.dryRun !== true) {
      const placeholder = resolveMissingLeafPlaceholder(ctx.config.missing?.placeholder).placeholder;
      const coreCtx = createCliCoreContext(ctx);
      for (const entry of result.targets) {
        if (entry.toAdd.length === 0) continue;
        writeMissingPaths(coreCtx, {
          targetPath: entry.target.targetPath,
          localeJson: entry.target.localeJson,
          localeCode: entry.target.selectedLocaleCode,
          paths: entry.toAdd,
          placeholder,
          writePlan: entry.writePlan,
        });
      }
    }
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
