import { resolveContext } from '@/shared/context/index.js';
import { I18nPruneError } from '@i18nprune/core';
import {
  confirmFillAsk,
  executeFillWithTargets,
  resolveFillLanguages,
  scanFillDynamicKeySites,
} from '@/commands/fill/executeFill.js';
import { runFill } from '@/commands/fill/runFill.js';
import { printCommandSummary } from '@/output/index.js';
import { stringifyEnvelope } from '@/shared/result/cliJson.js';
import {
  isLocaleTargetMissingMessage,
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  issuesFromLocaleTargetMissing,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { canPrintInfo, canPrintWarn } from '@/utils/logger/policy.js';
import { logger } from '@/utils/logger/index.js';
import { noopRunEmitter } from '@i18nprune/core';
import { mergeFillOptionsFromEnv } from '@/commands/fill/env.js';
import type { FillOptions } from '@/types/command/fill/index.js';
import type { Issue } from '@/types/core/json/envelope.js';
import { refreshProjectReportCache, resolveExtractionBaselineCounts } from '@/shared/cache/index.js';
import { applyCommandPatching } from '@/shared/patching/apply.js';
import { logTranslateFailureHelp } from '@/shared/translation/failureHelp.js';
import { attachWallTimer } from '@/utils/timer/index.js';

async function resolveFillData(
  ctx: Awaited<ReturnType<typeof resolveContext>>,
  merged: ReturnType<typeof mergeFillOptionsFromEnv>,
  runId: string,
): Promise<
  | { mode: 'json'; envelope: Awaited<ReturnType<typeof runFill>> }
  | { mode: 'human'; dynamicSites: ReturnType<typeof scanFillDynamicKeySites>; targets: string[]; payload: Awaited<ReturnType<typeof executeFillWithTargets>>['payload'] | undefined; aborted: boolean }
> {
  if (ctx.run.json) {
    return { mode: 'json', envelope: await runFill(ctx, merged, { emit: noopRunEmitter, runId }) };
  }
  const dynamicSites = scanFillDynamicKeySites(ctx);
  const targets = await resolveFillLanguages(ctx, merged);
  const confirmed = await confirmFillAsk(ctx, merged, targets);
  if (!confirmed) return { mode: 'human', dynamicSites, targets, payload: undefined, aborted: true };
  const out = await executeFillWithTargets(ctx, merged, targets, dynamicSites);
  return { mode: 'human', dynamicSites, targets, payload: out.payload, aborted: false };
}

export async function fill(opts: FillOptions): Promise<void> {
  const wall = attachWallTimer();
  const runId = String(Date.now());
  let ctx: Awaited<ReturnType<typeof resolveContext>> | undefined;
  try {
    ctx = await resolveContext();
    const merged = mergeFillOptionsFromEnv(opts);
    if (ctx.run.json) {
      const resolved = await resolveFillData(ctx, merged, runId);
      const envelope = resolved.mode === 'json' ? resolved.envelope : await runFill(ctx, merged, { emit: noopRunEmitter, runId });
      console.log(stringifyEnvelope(envelope));
      if (!envelope.ok) {
        process.exitCode = 1;
        return;
      }
      const payload = envelope.data;
      if (!merged.dryRun) {
        const writtenTargets = payload.targetResults
          .filter((row) => row.status === 'written')
          .map((row) => row.target);
        await applyCommandPatching({
          ctx,
          command: 'fill',
          action: 'upsert_locales',
          localeCodes: writtenTargets,
        });
        refreshProjectReportCache(ctx);
      }
      return;
    }

    const resolved = await resolveFillData(ctx, merged, runId);
    if (resolved.mode !== 'human') {
      throw new I18nPruneError('fill: expected human-mode fill resolver result', 'USAGE');
    }
    const dynamicSites = resolved.dynamicSites;
    const summaryIssues = mergeIssues(
      issuesFromDiscoveryWarnings(ctx.meta.warnings),
      issuesFromDynamicScanCount(dynamicSites.length),
    );
    if (dynamicSites.length > 0 && canPrintWarn(ctx.run)) {
      logger.warn(
        `${String(dynamicSites.length)} translation call(s) use a non-literal key — fill follows source JSON paths only; computed keys are not enumerated here.`,
        ctx.run,
      );
    }
    if (resolved.aborted) {
      if (canPrintInfo(ctx.run)) logger.info('aborted (no files changed).', ctx.run);
      printCommandSummary(
        {
          command: 'fill',
          ok: true,
          durationMs: wall.elapsedMs(),
          counts: resolveExtractionBaselineCounts(ctx),
          notes: ['aborted: user declined --ask confirmation'],
          issues: summaryIssues,
        },
        ctx,
      );
      return;
    }

    const payload = resolved.payload!;

    const needsReview = payload.targetResults.reduce((n, row) => n + (row.markedForReview ?? 0), 0);
    printCommandSummary(
      {
        command: 'fill',
        ok: true,
        durationMs: wall.elapsedMs(),
        counts: {
          locales: payload.targets.length,
          updated: payload.updated,
          sourceLeaves: payload.sourceLeaves,
          needsReview,
          ...resolveExtractionBaselineCounts(ctx),
        },
        issues: summaryIssues,
      },
      ctx,
    );
    if (!merged.dryRun) {
      const writtenTargets = payload.targetResults
        .filter((row) => row.status === 'written')
        .map((row) => row.target);
      await applyCommandPatching({
        ctx,
        command: 'fill',
        action: 'upsert_locales',
        localeCodes: writtenTargets,
      });
      refreshProjectReportCache(ctx);
    }
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    const embedded = err && typeof err === 'object' && 'issues' in err ? (err as { issues?: Issue[] }).issues : [];
    if (embedded && embedded.length > 0 && ctx) {
      logTranslateFailureHelp(ctx, 'fill', embedded);
      printCommandSummary(
        {
          command: 'fill',
          ok: false,
          durationMs: wall.elapsedMs(),
          issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), embedded),
        },
        ctx,
      );
      process.exitCode = 1;
      return;
    }
    if (
      ctx &&
      err instanceof I18nPruneError &&
      err.code === 'USAGE' &&
      isLocaleTargetMissingMessage(errMessage)
    ) {
      printCommandSummary(
        {
          command: 'fill',
          ok: false,
          durationMs: wall.elapsedMs(),
          issues: mergeIssues(
            issuesFromDiscoveryWarnings(ctx.meta.warnings),
            issuesFromLocaleTargetMissing(errMessage),
          ),
        },
        ctx,
      );
      process.exitCode = 1;
      return;
    }
    throw err;
  } finally {
    wall.dispose();
  }
}
