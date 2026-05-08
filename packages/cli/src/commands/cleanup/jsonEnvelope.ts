import { collectStringLeaves } from '@i18nprune/core';
import { toExtractorScanInput } from '@/shared/extractor/scanInput.js';
import { computeCleanupCandidateKeys } from '@i18nprune/core';
import { resolveCleanupKeysWithStringPresence } from '@/shared/cleanup/stringPresence.js';
import { buildKeyReferenceContext } from '@/shared/reference/context.js';
import { resolveReferenceConfig } from '@i18nprune/core';
import { readHostJsonUnknown } from '@/shared/io/hostJson.js';
import { isRipgrepAvailable } from '@/utils/rg/index.js';
import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import {
  issuesFromCleanupRipgrepUnavailable,
  issuesFromCleanupUncertainExcluded,
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import type { Context } from '@/types/core/context/index.js';
import type { CleanupJsonOutput, CleanupOptions } from '@/types/command/cleanup/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import { emitRunErrorFromUnknown, emitRunEvent, extractor, nowMs } from '@i18nprune/core';
import type { RunEmitter } from '@i18nprune/core';

/** Same `cleanup --json` / `--check-only` payload (no writes). */
export function runCleanupCheck(
  ctx: Context,
  opts: CleanupOptions,
  runtime?: { emit?: RunEmitter; runId?: string },
): CliJsonEnvelope<'cleanup', CleanupJsonOutput> {
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'cleanup', runId: runtime?.runId, at: nowMs() });
  try {
    const envelope = runCleanupCheckCore(ctx, opts);
    emitRunEvent(runtime?.emit, {
      type: 'run.completed',
      op: 'cleanup',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.summary',
      op: 'cleanup',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: { wouldRemove: envelope.data.wouldRemove, dynamicKeySites: envelope.data.dynamicKeySites },
    });
    return envelope;
  } catch (err) {
    emitRunErrorFromUnknown(runtime?.emit, {
      op: 'cleanup',
      runId: runtime?.runId,
      err,
      code: 'i18nprune.run.cleanup_failed',
      recoverable: false,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.failed',
      op: 'cleanup',
      runId: runtime?.runId,
      at: nowMs(),
      error: {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        recoverable: false,
      },
    });
    const empty: CleanupJsonOutput = {
      wouldRemove: 0,
      keys: [],
      dynamicKeySites: 0,
      uncertainPrefixes: [],
    };
    return buildIoReadFailureEnvelope('cleanup', empty, ctx, err);
  }
}

function runCleanupCheckCore(ctx: Context, opts: CleanupOptions): CliJsonEnvelope<'cleanup', CleanupJsonOutput> {
  const eff = resolveReferenceConfig('cleanup', ctx.config);
  const refCtx = buildKeyReferenceContext(ctx, eff);
  const scanInput = toExtractorScanInput(ctx);
  const dynamicSites = extractor.dynamic.scanProjectDynamicKeySites(scanInput);
  const sourcePath = ctx.paths.sourceLocale;
  const sourceRaw = readHostJsonUnknown(sourcePath, ctx.adapters.fs);
  const leaves = collectStringLeaves(sourceRaw);
  const usage = extractor.keySites.scanProjectLiteralKeyUsage(scanInput);
  const filterUncertain =
    eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only';
  const { candidates, excludedUncertain } = computeCleanupCandidateKeys({
    leaves,
    usage,
    preserve: ctx.config.policies?.preserve,
    uncertainPrefixes: refCtx.uncertainPrefixes,
    filterUncertainPrefixes: filterUncertain,
  });

  const rgOk = opts.skipRg ? false : isRipgrepAvailable();
  const safeToRemove = resolveCleanupKeysWithStringPresence({
    candidates,
    leaves,
    srcRoot: ctx.paths.srcRoot,
    eff,
    skipRg: Boolean(opts.skipRg),
    rgOk,
    logDetail: undefined,
  });

  const jsonPayload: CleanupJsonOutput = {
    wouldRemove: safeToRemove.length,
    keys: safeToRemove,
    dynamicKeySites: dynamicSites.length,
    uncertainPrefixes: refCtx.uncertainPrefixes,
  };

  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSites.length),
    issuesFromCleanupUncertainExcluded(excludedUncertain),
    !opts.skipRg && !rgOk ? issuesFromCleanupRipgrepUnavailable() : [],
  );

  return buildCliJsonEnvelope('cleanup', jsonPayload, {
    ok: true,
    issues,
    cwd: process.cwd(),
  });
}

