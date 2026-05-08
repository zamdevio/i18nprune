import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromQualityEnglishIdentical,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { QualityOptions } from '@/types/command/quality/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import type { QualityJsonData } from '@i18nprune/core/types';
import { measureQualityEnglishIdentical } from '@/shared/quality/measure.js';
import { buildQualityJsonData, emitRunErrorFromUnknown, emitRunEvent, nowMs } from '@i18nprune/core';
import type { RunEmitter } from '@i18nprune/core';

export function runQuality(
  ctx: Context,
  opts: QualityOptions,
  runtime?: { emit?: RunEmitter; runId?: string },
): CliJsonEnvelope<'quality', QualityJsonData> {
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'quality', runId: runtime?.runId, at: nowMs() });
  try {
    const envelope = runQualityCore(ctx, opts);
    emitRunEvent(runtime?.emit, {
      type: 'run.completed',
      op: 'quality',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.summary',
      op: 'quality',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: { total: envelope.data.total, dynamicKeySites: envelope.data.dynamicKeySites },
    });
    return envelope;
  } catch (err) {
    emitRunErrorFromUnknown(runtime?.emit, {
      op: 'quality',
      runId: runtime?.runId,
      err,
      code: 'i18nprune.run.quality_failed',
      recoverable: false,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.failed',
      op: 'quality',
      runId: runtime?.runId,
      at: nowMs(),
      error: {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        recoverable: false,
      },
    });
    const empty: QualityJsonData = { total: 0, perFile: {}, dynamicKeySites: 0 };
    return buildIoReadFailureEnvelope('quality', empty, ctx, err);
  }
}

function runQualityCore(
  ctx: Context,
  opts: QualityOptions,
): CliJsonEnvelope<'quality', QualityJsonData> {
  const { total, perFile, dynamicKeySites } = measureQualityEnglishIdentical(ctx, opts);
  const data: QualityJsonData = buildQualityJsonData({ total, perFile, dynamicKeySites });
  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicKeySites),
    issuesFromQualityEnglishIdentical(total),
  );

  return buildCliJsonEnvelope('quality', data, {
    ok: true,
    issues,
    cwd: process.cwd(),
  });
}
