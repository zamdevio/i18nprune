import path from 'node:path';
import { resolvePathsToAddForMissing } from './paths.js';
import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromMissingSkippedNotInScan,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { MissingJsonOutput, MissingOptions } from '@/types/command/missing/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import { emitRunErrorFromUnknown, emitRunEvent, nowMs } from '@i18nprune/core';
import type { RunEmitter } from '@i18nprune/core';
import { resolveMissingTargetState } from './target.js';
import { resolveDynamicSitesCount } from '@/shared/cache/index.js';

function emptyMissingPayload(opts: MissingOptions): MissingJsonOutput {
  return {
    kind: 'missing',
    targetPath: '',
    targetKind: 'source',
    pathsAdded: 0,
    paths: [],
    dryRun: Boolean(opts.dryRun),
    skippedNotInScan: [],
  };
}

/**
 * Same payload as `missing --json` (before interactive write). On I/O or path errors returns **`ok: false`**
 * with **`i18nprune.io.read_failed`** instead of throwing (for `--json` consumers).
 */
export function runMissing(
  ctx: Context,
  opts: MissingOptions,
  runtime?: { emit?: RunEmitter; runId?: string },
): CliJsonEnvelope<'missing', MissingJsonOutput> {
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'missing', runId: runtime?.runId, at: nowMs() });
  try {
    const { targetPath, targetKind, localeJson } = resolveMissingTargetState(ctx, opts);

    const { toAdd, skippedNotInScan } = resolvePathsToAddForMissing(ctx, localeJson);

    const jsonPayload: MissingJsonOutput = {
      kind: 'missing',
      targetPath: path.relative(process.cwd(), targetPath) || targetPath,
      targetKind,
      pathsAdded: toAdd.length,
      paths: toAdd,
      dryRun: Boolean(opts.dryRun),
      skippedNotInScan,
    };

    const dynamicSites = resolveDynamicSitesCount(ctx);
    const issues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      issuesFromDynamicScanCount(dynamicSites),
      issuesFromMissingSkippedNotInScan(skippedNotInScan),
    );

    const envelope = buildCliJsonEnvelope('missing', jsonPayload, {
      ok: true,
      issues,
      cwd: process.cwd(),
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.completed',
      op: 'missing',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.summary',
      op: 'missing',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: { pathsAdded: jsonPayload.pathsAdded },
    });
    return envelope;
  } catch (err) {
    emitRunErrorFromUnknown(runtime?.emit, {
      op: 'missing',
      runId: runtime?.runId,
      err,
      code: 'i18nprune.run.missing_failed',
      recoverable: false,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.failed',
      op: 'missing',
      runId: runtime?.runId,
      at: nowMs(),
      error: {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        recoverable: false,
      },
    });
    return buildIoReadFailureEnvelope('missing', emptyMissingPayload(opts), ctx, err);
  }
}
