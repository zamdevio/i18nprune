import { toExtractorScanInput } from '@/shared/extractor/scanInput.js';
import { I18nPruneError } from '@i18nprune/core';
import { buildCliJsonEnvelope } from '@/shared/result/cliJson.js';
import { buildIoReadFailureEnvelope } from '@/shared/result/ioEnvelope.js';
import {
  isLocaleTargetMissingMessage,
  mergeIssues,
  issuesFromDiscoveryWarnings,
  issuesFromLocaleTargetMissing,
  usageIssueFromI18nPruneError,
} from '@/shared/result/cliEnvelopeIssues.js';
import { ISSUE_FILL_USAGE } from '@/constants/issueCodes.js';
import {
  executeFillWithTargets,
  resolveFillLanguages,
} from './executeFill.js';
import { mergeFillOptionsFromEnv } from '@/commands/fill/env.js';
import { safeTranslationMetaForEnvelope } from '@/shared/translation/resolveProvider.js';
import { emitIssuesAsRunErrors, emitRunErrorFromUnknown, emitRunEvent, extractor, nowMs } from '@i18nprune/core';
import type { RunEmitter } from '@i18nprune/core';
import type { FillOptions } from '@/types/command/fill/index.js';
import type { FillJsonPayload } from '@/types/command/fill/json.js';
import type { Context } from '@/types/core/context/index.js';
import type { CliJsonEnvelope } from '@/types/core/json/envelope.js';
import type { Issue } from '@/types/core/json/envelope.js';

function emptyFillPayload(ctx: Context, opts: FillOptions): FillJsonPayload {
  return {
    kind: 'fill',
    ...safeTranslationMetaForEnvelope(ctx, opts.provider),
    dryRun: Boolean(opts.dryRun),
    targets: [],
    updated: 0,
    sourceLeaves: 0,
    dynamicKeySites: 0,
    targetResults: [],
  };
}

function fillUsageEnvelope(ctx: Context, opts: FillOptions, err: I18nPruneError): CliJsonEnvelope<'fill', FillJsonPayload> {
  const message = err.message;
  const usageIssue: Issue = isLocaleTargetMissingMessage(message)
    ? issuesFromLocaleTargetMissing(message)[0]!
    : usageIssueFromI18nPruneError(err, ISSUE_FILL_USAGE);
  return buildCliJsonEnvelope('fill', emptyFillPayload(ctx, opts), {
    ok: false,
    issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), [usageIssue]),
    cwd: process.cwd(),
  });
}

/** Same workflow as **`fill --json`** (writes unless **`dryRun`**). */
export async function runFill(
  ctx: Context,
  opts: FillOptions,
  runtime?: { emit?: RunEmitter; runId?: string },
): Promise<CliJsonEnvelope<'fill', FillJsonPayload>> {
  const merged = mergeFillOptionsFromEnv(opts);
  emitRunEvent(runtime?.emit, { type: 'run.started', op: 'fill', runId: runtime?.runId, at: nowMs() });
  emitRunEvent(runtime?.emit, { type: 'run.progress.fill', op: 'fill', runId: runtime?.runId, at: nowMs(), phase: 'scan_dynamic_sites' });
  const dynamicSites = extractor.dynamic.scanProjectDynamicKeySites(toExtractorScanInput(ctx));
  emitRunEvent(runtime?.emit, {
    type: 'run.progress.fill',
    op: 'fill',
    runId: runtime?.runId,
    at: nowMs(),
    phase: 'scan_dynamic_sites',
    current: dynamicSites.length,
    total: dynamicSites.length,
    label: `${String(dynamicSites.length)} dynamic key site(s)`,
  });
  try {
    emitRunEvent(runtime?.emit, {
      type: 'run.progress.fill',
      op: 'fill',
      runId: runtime?.runId,
      at: nowMs(),
      phase: 'resolve_targets',
    });
    const targets = await resolveFillLanguages(ctx, merged);
    emitRunEvent(runtime?.emit, {
      type: 'run.progress.fill',
      op: 'fill',
      runId: runtime?.runId,
      at: nowMs(),
      phase: 'resolve_targets',
      current: targets.length,
      total: targets.length,
    });
    const { payload, issues } = await executeFillWithTargets(ctx, merged, targets, dynamicSites, runtime);
    const envelope = buildCliJsonEnvelope('fill', payload, {
      ok: true,
      issues,
      cwd: process.cwd(),
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.completed',
      op: 'fill',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.summary',
      op: 'fill',
      runId: runtime?.runId,
      at: nowMs(),
      ok: envelope.ok,
      issueCount: envelope.issues.length,
      counts: {
        targets: payload.targets.length,
        updated: payload.updated,
        sourceLeaves: payload.sourceLeaves,
      },
    });
    return envelope;
  } catch (err) {
    if (err instanceof I18nPruneError && err.code === 'USAGE') {
      const envelope = fillUsageEnvelope(ctx, merged, err);
      emitIssuesAsRunErrors(runtime?.emit, {
        op: 'fill',
        runId: runtime?.runId,
        issues: envelope.issues,
        recoverable: true,
      });
      emitRunEvent(runtime?.emit, {
        type: 'run.completed',
        op: 'fill',
        runId: runtime?.runId,
        at: nowMs(),
        ok: envelope.ok,
      });
      emitRunEvent(runtime?.emit, {
        type: 'run.summary',
        op: 'fill',
        runId: runtime?.runId,
        at: nowMs(),
        ok: envelope.ok,
        issueCount: envelope.issues.length,
        counts: { targets: 0, updated: 0, sourceLeaves: 0 },
      });
      return envelope;
    }
    if (err && typeof err === 'object' && 'issues' in err) {
      const embedded = (err as { issues?: Issue[] }).issues ?? [];
      if (embedded.length > 0) {
        emitIssuesAsRunErrors(runtime?.emit, {
          op: 'fill',
          runId: runtime?.runId,
          issues: embedded,
          recoverable: true,
        });
        const envelope = buildCliJsonEnvelope('fill', emptyFillPayload(ctx, merged), {
          ok: false,
          issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), embedded),
          cwd: process.cwd(),
        });
        emitRunEvent(runtime?.emit, {
          type: 'run.completed',
          op: 'fill',
          runId: runtime?.runId,
          at: nowMs(),
          ok: envelope.ok,
        });
        emitRunEvent(runtime?.emit, {
          type: 'run.summary',
          op: 'fill',
          runId: runtime?.runId,
          at: nowMs(),
          ok: envelope.ok,
          issueCount: envelope.issues.length,
          counts: { targets: 0, updated: 0, sourceLeaves: 0 },
        });
        return envelope;
      }
    }
    emitRunErrorFromUnknown(runtime?.emit, {
      op: 'fill',
      runId: runtime?.runId,
      err,
      code: 'i18nprune.run.fill_failed',
      recoverable: false,
    });
    emitRunEvent(runtime?.emit, {
      type: 'run.failed',
      op: 'fill',
      runId: runtime?.runId,
      at: nowMs(),
      error: {
        name: err instanceof Error ? err.name : 'Error',
        message: err instanceof Error ? err.message : String(err),
        recoverable: false,
      },
    });
    return buildIoReadFailureEnvelope('fill', emptyFillPayload(ctx, merged), ctx, err);
  }
}
