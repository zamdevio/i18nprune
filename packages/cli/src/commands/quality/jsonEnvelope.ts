import {
  buildCliJsonEnvelope,
  emitRunErrorFromUnknown,
  emitRunEvent,
  nowMs,
  runQuality as runCoreQuality,
} from '@i18nprune/core';
import type { QualityJsonData, QualityRunOptions, RunEmitter } from '@i18nprune/core';
import type {
  QualityJsonEnvelopeResult,
  QualityJsonRunResult,
  QualityRuntime,
} from '@/types/command/quality/index.js';

import { buildQualityHostHooks } from '@/commands/quality/hooks.js';
import { createCliCoreContext } from '@/shared/context/index.js';
import { buildIoReadFailureEnvelope, issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/index.js';
import type { Context } from '@/types/core/context/index.js';

export function emptyQualityPayload(): QualityJsonData {
  return {
    total: 0,
    perFile: {},
    dynamicKeySites: 0,
    dynamicKeySitesActive: 0,
    dynamicKeySitesCommented: 0,
    sourceLocale: '',
    localesDir: '',
    localeCount: 0,
    targetLocaleCount: 0,
    files: [],
  };
}

export function executeCore(ctx: Context, opts: QualityRunOptions, runtime: QualityRuntime = {}): QualityJsonRunResult {
  const coreCtx = createCliCoreContext(ctx);
  const out = runCoreQuality(coreCtx, opts, buildQualityHostHooks(runtime));
  const issues = mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), out.issues);
  const envelope = buildCliJsonEnvelope('quality', out.payload, {
    ok: true,
    issues,
    cwd: ctx.adapters.system.cwd(),
  });
  return { ...out, envelope };
}

/** `--json` mode wrapper: returns a stable envelope and keeps `runQuality` reserved for core. */
export function runQualityJsonEnvelope(
  ctx: Context,
  opts: QualityRunOptions,
  runtime?: QualityRuntime,
): QualityJsonEnvelopeResult {
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'quality', runId: runtime?.runId, at: nowMs() });
  try {
    const result = executeCore(ctx, opts, runtime);
    emitRunEvent(runtime?.emit, {
      type: 'run.completed',
      op: 'quality',
      runId: runtime?.runId,
      at: nowMs(),
      ok: result.envelope.ok,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.summary',
      op: 'quality',
      runId: runtime?.runId,
      at: nowMs(),
      ok: result.envelope.ok,
      issueCount: result.envelope.issues.length,
      counts: {
        total: result.payload.total,
        dynamicKeySites: result.payload.dynamicKeySitesActive,
        ...(result.payload.dynamicKeySitesCommented > 0
          ? { commented: result.payload.dynamicKeySitesCommented }
          : {}),
      },
    });
    return { envelope: result.envelope, result };
  } catch (err) {
    emitQualityFailureEvents(runtime?.emit, runtime?.runId, err);
    return { envelope: buildIoReadFailureEnvelope('quality', emptyQualityPayload(), ctx, err) };
  }
}

function emitQualityFailureEvents(emit: RunEmitter | undefined, runId: string | undefined, err: unknown): void {
  emitRunErrorFromUnknown(emit, {
    op: 'quality',
    runId,
    err,
    code: 'i18nprune.run.quality_failed',
    recoverable: false,
  });
  emitRunEvent(emit, {
    type: 'run.failed',
    op: 'quality',
    runId,
    at: nowMs(),
    error: {
      name: err instanceof Error ? err.name : 'Error',
      message: err instanceof Error ? err.message : String(err),
      recoverable: false,
    },
  });
}
