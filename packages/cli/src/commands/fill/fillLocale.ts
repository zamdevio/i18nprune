import path from 'node:path';
import { collectReviewLeaves } from '@i18nprune/core';
import {
  applyLocaleLeafNormalization,
  resolveTranslator,
  translateFillCandidateLeaves,
  type ResolvedTranslationProviderOptions,
} from '@i18nprune/core';
import { createSessionProgress } from '@/shared/progress/session.js';
import { createFillTickProgressRelay } from '@/shared/progress/tickRelay.js';
import { bindTranslationProgressTick } from '@/shared/progress/translation.js';
import { translationMetaForEnvelope } from '@/shared/translation/resolveProvider.js';
import {
  createIdentityStreakGuard,
  IdentityAbortError,
  logIdentityStreakAbortNoWriteNotice,
} from '@/shared/translator/identity.js';
import { existsRuntimeFsSync } from '@i18nprune/core';
import { readHostJsonUnknown, writeHostJson } from '@/shared/io/hostJson.js';
import { printFillDryRunSummary, printFillTargetFinalizeSummary } from './summary.js';
import { getLanguageByCode } from '@/shared/languages/index.js';
import { I18nPruneError, issueCodeRepoDocPathForIssueCode } from '@i18nprune/core';
import { ISSUE_LOCALE_TARGET_NOT_FOUND, ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT } from '@/constants/issueCodes.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo } from '@/utils/logger/policy.js';
import { shouldSkipLocaleMetaSidecar } from '@/shared/locales/sidecar.js';
import {
  buildTranslateParallelLimitSuggestion,
  resolveCliProviderRateLimitProfile,
  resolveCliTranslateMaxParallelEffective,
  resolveCliTranslateRateLimitEffective,
} from '@/shared/translation/resolveTranslateParallel.js';
import type { FillOptions } from '@/types/command/fill/index.js';
import type { Issue } from '@/types/core/json/envelope.js';
import type { TargetProgressSummary } from '@/types/core/progress/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { EffectiveReferenceConfig } from '@i18nprune/core/config';
import type { KeyReferenceContext } from '@/types/core/reference/context.js';
import type { LocaleMetadataReport } from '@/types/core/localeLeaves/index.js';
import type { RunEmitter } from '@i18nprune/core';

/**
 * Fills one target locale from `sourceMap` (source leaf path → value); returns count of leaves updated or would-update.
 */
export async function fillOneLocale(
  ctx: Context,
  opts: FillOptions,
  target: string,
  sourceMap: Map<string, string>,
  refCtx: KeyReferenceContext,
  eff: EffectiveReferenceConfig,
  translation: ResolvedTranslationProviderOptions,
  tickProgressRun?: { emit?: RunEmitter; runId?: string },
  /** In-memory locale JSON after a retryable interrupt — continue translating without re-reading disk. */
  resumeLocaleJson?: unknown,
): Promise<{
  updated: number;
  targetPath: string;
  metaPath: string | null;
  progress: TargetProgressSummary;
  issues: Issue[];
  localeMetadata: LocaleMetadataReport;
  markedForReview: number;
}> {
  const started = Date.now();
  const catalog = getLanguageByCode(target);
  const { fs } = ctx.adapters;
  const targetPath = path.join(ctx.paths.localesDir, `${target}.json`);
  if (!existsRuntimeFsSync(targetPath, fs)) {
    throw new I18nPruneError(`fill: locale file missing: ${targetPath}`, 'USAGE', {
      issueCode: ISSUE_LOCALE_TARGET_NOT_FOUND,
    });
  }
  const targetRaw = readHostJsonUnknown(targetPath, fs);
  const tLeaves = collectReviewLeaves(targetRaw);
  const metaPathFull = path.join(ctx.paths.localesDir, `${target}.meta.json`);
  const skipSidecar = shouldSkipLocaleMetaSidecar(opts, ctx.config);
  const metaPath = skipSidecar ? null : metaPathFull;
  let metaDirection: 'ltr' | 'rtl' = 'ltr';
  if (existsRuntimeFsSync(metaPathFull, fs)) {
    const prev = readHostJsonUnknown(metaPathFull, fs);
    if (
      prev &&
      typeof prev === 'object' &&
      (prev as { direction?: string }).direction === 'rtl'
    ) {
      metaDirection = 'rtl';
    }
  }

  const provider = resolveTranslator(translation);
  const maxParallelTranslates = resolveCliTranslateMaxParallelEffective({
    config: ctx.config,
    workers: opts.workers,
    providerId: translation.provider,
  });
  const rateLimit = resolveCliTranslateRateLimitEffective({
    config: ctx.config,
    providerId: translation.provider,
  });
  const providerProfile = resolveCliProviderRateLimitProfile({
    config: ctx.config,
    providerId: translation.provider,
  });
  const limitSuggestion = buildTranslateParallelLimitSuggestion({
    config: ctx.config,
    workers: opts.workers,
    providerId: translation.provider,
  });
  if (limitSuggestion) logger.warn(limitSuggestion, ctx.run);
  let next: unknown = resumeLocaleJson ?? targetRaw;
  let markedForReview = 0;

  const session = createSessionProgress({ quiet: ctx.run.quiet, json: ctx.run.json });
  const streakGuard = createIdentityStreakGuard(ctx, 'fill', target, {
    pauseClock: () => session.progress.pauseClock?.({ clearBar: false }),
    resumeClock: () => session.progress.resumeClock?.(),
  });
  let changed = 0;
  let translateStats = { requestAttempts: 0, retriesMade: 0, successfulLeaves: 0, failedRequests: 0 };
  try {
      const filled = await translateFillCandidateLeaves({
      tLeaves,
      next,
      sourceMap,
      refCtx: { uncertainPrefixes: refCtx.uncertainPrefixes },
      eff,
      preserve: ctx.config.policies?.preserve,
      parity: ctx.config.policies?.parity,
      provider,
      providerId: translation.provider,
      persistStructuredLeafMetadata: opts.metadata === true,
      target,
      dryRun: Boolean(opts.dryRun),
      maxParallelTranslates,
      rateLimit,
      tickProgress: tickProgressRun?.emit
        ? createFillTickProgressRelay({
            tick: bindTranslationProgressTick(session.progress),
            emit: tickProgressRun.emit,
            runId: tickProgressRun.runId,
            target,
            translationMeta: translationMetaForEnvelope(translation),
          })
        : bindTranslationProgressTick(session.progress),
      onTranslatedLeaf: async (sourceText, translatedText, path) => {
        await streakGuard.onTranslated(sourceText, translatedText, path);
      },
    });
    next = filled.next;
    changed = filled.changed;
    translateStats = filled.translateStats;
      markedForReview = filled.markedForReview;
    session.finish();
    if (canPrintInfo(ctx.run)) {
      const wallMs = Date.now() - started;
      const avgRequestMs = translateStats.requestAttempts > 0 ? Math.round(wallMs / translateStats.requestAttempts) : 0;
      logger.info(
        `progress (${target}): wall=${String(wallMs)}ms · requests=${String(translateStats.requestAttempts)} · success=${String(translateStats.successfulLeaves)} · failed=${String(translateStats.failedRequests)} · retries=${String(translateStats.retriesMade)} · avgRequest=${String(avgRequestMs)}ms`,
        ctx.run,
      );
      logger.info(
        `provider (${target}): id=${translation.provider} · workersRequested=${String(opts.workers ?? maxParallelTranslates)} · workersUsed=${String(maxParallelTranslates)} · maxConcurrency=${String(providerProfile.maxConcurrency)} · rpm=${String(rateLimit?.rpm ?? providerProfile.rpm)} · rps=${String(rateLimit?.rps ?? providerProfile.rps)} · intervalMs=${String(rateLimit?.intervalMs ?? providerProfile.intervalMs)}`,
        ctx.run,
      );
      logger.info(
        `leaves (${target}): valuesUpdated=${String(changed)} · needsReview=${String(markedForReview)}`,
        ctx.run,
      );
    }
  } catch (e) {
    session.fail();
    if (e instanceof IdentityAbortError) {
      logIdentityStreakAbortNoWriteNotice(ctx, e, { dryRun: Boolean(opts.dryRun), commandDisplay: 'fill' });
      const issues = [
        ...streakGuard.flushIssues(),
        {
          severity: 'error' as const,
          code: ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT,
          message: e.message,
          docPath: issueCodeRepoDocPathForIssueCode(ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT),
        },
      ];
      (e as Error & { issues?: Issue[] }).issues = issues;
    }
    throw e;
  }

  const normalized = applyLocaleLeafNormalization({
    localeJson: next,
    sourceMap,
    resolveInput: {
      configMode: opts.metadata ? ctx.config.localeLeaves?.mode : 'legacy_string',
      metadataFlag: opts.metadata === true,
      stripMetadataFlag: false,
    },
  });
  next = normalized.next;
  const modeDecision = normalized.modeDecision;
  const localeWouldChange = JSON.stringify(targetRaw) !== JSON.stringify(next);
  if (!opts.dryRun && localeWouldChange) {
    writeHostJson(targetPath, next, fs);
  }
  if (!opts.dryRun && metaPath !== null) {
    writeHostJson(
      metaPath,
      {
        lang: target,
        englishName: catalog?.english ?? target,
        nativeName: catalog?.native ?? target,
        direction: metaDirection,
      },
      fs,
    );
  }

  if (opts.dryRun) {
    printFillDryRunSummary(
      {
        target,
        targetPath,
        metaPath,
        showMeta: true,
        leafTotal: tLeaves.length,
        direction: metaDirection,
      },
      ctx.run,
    );
    printFillTargetFinalizeSummary(
      {
        target,
        updated: changed,
        targetPath,
        metaPath,
        dryRun: true,
        showMeta: true,
      },
      ctx.run,
    );
  }

  if (!opts.dryRun) {
    printFillTargetFinalizeSummary(
      {
        target,
        updated: changed,
        targetPath,
        metaPath,
        dryRun: false,
        showMeta: true,
      },
      ctx.run,
    );
  }
  if (modeDecision.mode === 'structured') {
    logger.info(
      `metadata for ${target}: structured ${String(normalized.report.structuredLeavesWritten)}, repaired ${String(normalized.report.repairedCorruptLeaves)}. Use "sync --strip-metadata" to remove metadata fields later.`,
      ctx.run,
    );
  }

  return {
    updated: changed,
    targetPath,
    metaPath,
    issues: streakGuard.flushIssues(),
    localeMetadata: normalized.report,
    markedForReview,
    progress: {
      sourceLeafCount: sourceMap.size,
      processedLeafCount: tLeaves.length,
      translatedLeafCount: changed,
      updatedLeafCount: changed,
      durationMs: Date.now() - started,
      requestAttempts: translateStats.requestAttempts,
      requestRetries: translateStats.retriesMade,
      requestSuccesses: translateStats.successfulLeaves,
      requestFailures: translateStats.failedRequests,
    },
  };
}
