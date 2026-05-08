import { confirm } from '@inquirer/prompts';
import { I18nPruneError, TranslateRunInterruptedError } from '@i18nprune/core';
import { collectStringLeaves } from '@i18nprune/core';
import { fillOneLocale } from './fillLocale.js';
import { promptFillLanguageSelection } from './prompts.js';
import { readHostJsonUnknown } from '@/shared/io/hostJson.js';
import { buildKeyReferenceContext } from '@/shared/reference/context.js';
import { resolveReferenceConfig } from '@i18nprune/core';
import { canAsk } from '@/shared/ask/index.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import { canPrintInfo, canPrintWarn } from '@/utils/logger/policy.js';
import { rows, up } from '@/shared/cursor/index.js';
import { logger } from '@/utils/logger/index.js';
import { issuesFromDiscoveryWarnings, mergeIssues } from '@/shared/result/cliEnvelopeIssues.js';
import { emitRunEvent, nowMs } from '@i18nprune/core';
import type { RunEmitter, RunEvent } from '@i18nprune/core';
import type { FillJsonPayload, FillTargetJsonRow } from '@/types/command/fill/json.js';
import type { FillOptions } from '@/types/command/fill/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { DynamicKeySite } from '@/types/core/extractor/dynamic/index.js';
import type { Issue } from '@/types/core/json/envelope.js';
import { pickTargetSelector, resolveFillAllTargetCodes, resolveFillTargetCodesFromRaw } from '@i18nprune/core';
import { resolveLocalesDynamicSites } from '@/shared/cache/index.js';
import {
  assertTranslationProviderCredentialsReady,
  resolveTranslationProviderOrder,
  resolveTranslationProviderOptionsForId,
  resolveTranslationProviderOptions,
  translationMetaForEnvelope,
} from '@/shared/translation/resolveProvider.js';
import { classifyProviderFailureOutcome, isRetryableProviderFailure } from '@/shared/translation/providerFallback.js';
import { duringPrompt } from '@/utils/timer/index.js';

export async function resolveFillLanguages(ctx: Context, opts: FillOptions): Promise<string[]> {
  const projectFs = { fs: ctx.adapters.fs, path: ctx.adapters.path };
  const sourceBase = ctx.adapters.path.basename(ctx.paths.sourceLocale, '.json');
  if (opts.all) {
    return resolveFillAllTargetCodes(projectFs, ctx.paths.localesDir, sourceBase, 'fill');
  }
  const raw = pickTargetSelector(opts.target);
  if (!raw) {
    if (!canAsk(ctx.run)) {
      throw new I18nPruneError('fill requires --target or --all (non-interactive)', 'USAGE');
    }
    const picked = await promptFillLanguageSelection(ctx.paths.localesDir, sourceBase, projectFs, ctx.run);
    return resolveFillTargetCodesFromRaw({
      commandName: 'fill',
      raw: picked,
      localesDir: ctx.paths.localesDir,
      sourceLocalePath: ctx.paths.sourceLocale,
      runtime: projectFs,
    });
  }
  return resolveFillTargetCodesFromRaw({
    commandName: 'fill',
    raw,
    localesDir: ctx.paths.localesDir,
    sourceLocalePath: ctx.paths.sourceLocale,
    runtime: projectFs,
  });
}

/**
 * Scan + read source + fill targets. Caller resolves **`targets`** (after optional **`--ask`** confirm).
 */
export async function executeFillWithTargets(
  ctx: Context,
  opts: FillOptions,
  targets: string[],
  dynamicSites: DynamicKeySite[],
  runtime?: { emit?: RunEmitter; runId?: string },
): Promise<{ payload: FillJsonPayload; issues: Issue[] }> {
  const emit = runtime?.emit;
  const runId = runtime?.runId;
  const emitProgress = (
    e: Omit<Extract<RunEvent, { type: 'run.progress.fill' }>, 'op' | 'runId' | 'at'>,
  ): void => {
    emitRunEvent(emit, { op: 'fill', runId, at: nowMs(), ...e });
  };

  const eff = resolveReferenceConfig('fill', ctx.config);
  const refCtx = buildKeyReferenceContext(ctx, eff);
  const providerOrder = resolveTranslationProviderOrder(ctx, opts.provider);
  const primaryTranslation = resolveTranslationProviderOptions(ctx, opts.provider);
  assertTranslationProviderCredentialsReady(primaryTranslation);
  const translationMeta = translationMetaForEnvelope(primaryTranslation);
  emitProgress({ type: 'run.progress.fill', phase: 'read_source', label: ctx.paths.sourceLocale });
  const sourceRaw = readHostJsonUnknown(ctx.paths.sourceLocale, ctx.adapters.fs);
  const sourceLeaves = collectStringLeaves(sourceRaw);
  const sourceMap = new Map(sourceLeaves.map((l) => [l.path, l.value]));

  let totalUpdated = 0;
  const targetResults: FillTargetJsonRow[] = [];
  let targetIssues: Issue[] = [];
  for (let i = 0; i < targets.length; i++) {
    const target = targets[i]!;
    emitProgress({
      type: 'run.progress.fill',
      phase: 'build_target',
      target,
      current: i + 1,
      total: targets.length,
    });
    let result: Awaited<ReturnType<typeof fillOneLocale>> | undefined;
    let lastErr: unknown;
    let resumeLocaleJson: unknown | undefined;
    const providerAttempts: FillTargetJsonRow['providerAttempts'] = [];
    let winnerProviderId: FillTargetJsonRow['winnerProviderId'];
    for (let pi = 0; pi < providerOrder.length; pi += 1) {
      const providerId = providerOrder[pi]!;
      const translation = resolveTranslationProviderOptionsForId(ctx, providerId);
      assertTranslationProviderCredentialsReady(translation);
      const providerMeta = translationMetaForEnvelope(translation);
      emitProgress({ type: 'run.progress.fill', phase: 'translate', target, ...providerMeta });
      try {
        result = await fillOneLocale(ctx, opts, target, sourceMap, refCtx, eff, translation, {
          emit,
          runId,
        }, resumeLocaleJson);
        resumeLocaleJson = undefined;
        providerAttempts?.push({ providerId, outcome: 'success' });
        winnerProviderId = providerId;
        break;
      } catch (e) {
        const rootCause = e instanceof TranslateRunInterruptedError ? e.cause : e;
        lastErr = rootCause;
        providerAttempts?.push({
          providerId,
          outcome: classifyProviderFailureOutcome(rootCause),
        });
        if (e instanceof TranslateRunInterruptedError) {
          resumeLocaleJson = e.partialLocaleJson;
        }
        const hasNext = pi < providerOrder.length - 1;
        if (!hasNext || !isRetryableProviderFailure(rootCause)) {
          throw rootCause instanceof Error ? rootCause : e;
        }
        if (canPrintWarn(ctx.run)) {
          up(ctx.run, rows.gap);
          const nextProvider = providerOrder[pi + 1]!;
          const partialHint =
            e instanceof TranslateRunInterruptedError
              ? ` Partial progress kept (${String(e.translateStats.successfulLeaves)} leaf translation(s) succeeded before interrupt); next provider fills the rest without restarting.`
              : '';
          logger.warn(
            `provider "${providerId}" failed with a retryable backend error; retrying target "${target}" with "${nextProvider}".${partialHint}`,
            ctx.run,
          );
        }
      }
    }
    if (!result) throw (lastErr ?? new Error('fill: provider fallback exhausted without a result'));
    emitProgress({
      type: 'run.progress.fill',
      phase: 'translate',
      target,
      current: result.progress.processedLeafCount,
      total: result.progress.sourceLeafCount,
      label: `${String(result.progress.translatedLeafCount)} leaf/leaves updated`,
      ...translationMeta,
    });
    if (!opts.dryRun) {
      emitProgress({ type: 'run.progress.fill', phase: 'write_files', target, label: result.targetPath });
      if (result.metaPath) {
        emitProgress({ type: 'run.progress.fill', phase: 'write_files', target, label: result.metaPath });
      }
    }
    totalUpdated += result.updated;
    targetIssues = mergeIssues(targetIssues, result.issues);
    targetResults.push({
      target,
      status: opts.dryRun ? 'dry_run' : 'written',
      updated: result.updated,
      paths: { localeJson: result.targetPath, metaJson: result.metaPath },
      progress: result.progress,
      providerAttempts,
      winnerProviderId,
      fallbackCount: Math.max(0, (providerAttempts?.length ?? 0) - 1),
      markedForReview: result.markedForReview,
      localeMetadata: result.localeMetadata,
    });
    if (canPrintInfo(ctx.run)) {
      const route = (providerAttempts ?? []).map((a) => a.providerId).join(' -> ');
      logger.info(
        `provider route (${target}): ${route} (winner: ${winnerProviderId ?? 'none'}, fallbacks: ${String(Math.max(0, (providerAttempts?.length ?? 0) - 1))})`,
        ctx.run,
      );
    }
  }
  emitProgress({ type: 'run.progress.fill', phase: 'done' });

  const payload: FillJsonPayload = {
    kind: 'fill',
    providerId: translationMeta.providerId,
    dryRun: Boolean(opts.dryRun),
    targets,
    updated: totalUpdated,
    sourceLeaves: sourceLeaves.length,
    dynamicKeySites: dynamicSites.length,
    targetResults,
  };
  return {
    payload,
    issues: mergeIssues(issuesFromDiscoveryWarnings(ctx.meta.warnings), targetIssues),
  };
}

/** Interactive **`--ask`** confirmation; returns **`false`** if the user declined. */
export async function confirmFillAsk(
  ctx: Context,
  opts: FillOptions,
  targets: string[],
): Promise<boolean> {
  if (!opts.ask) return true;
  if (!canAsk(ctx.run)) {
    if (canPrintInfo(ctx.run)) {
      logger.info('--ask ignored (not an interactive terminal).', ctx.run);
    }
    return true;
  }
  if (getCliYesFlag()) return true;
  const ok = await duringPrompt(() =>
    confirm({
      message: `Fill ${String(targets.length)} locale(s): ${targets.join(', ')}?`,
      default: false,
    }),
  );
  return ok;
}

export function scanFillDynamicKeySites(ctx: Context): DynamicKeySite[] {
  return resolveLocalesDynamicSites(ctx) as DynamicKeySite[];
}
