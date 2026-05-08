import path from 'node:path';
import { I18nPruneError, issueCodeRepoDocPathForIssueCode } from '@i18nprune/core';
import { collectStringLeaves, deepClone } from '@i18nprune/core';
import { translateAndNormalizeGenerateLocale, TranslateRunInterruptedError } from '@i18nprune/core';
import { normalizeGeneratePromptLang, targetLocaleCoversAllSourcePaths } from '@i18nprune/core';
import { createSessionProgress } from '@/shared/progress/session.js';
import { createGenerateTickProgressRelay } from '@/shared/progress/tickRelay.js';
import { resolveTranslator } from '@i18nprune/core';
import {
  assertTranslationProviderCredentialsReady,
  resolveTranslationProviderOptionsForId,
  resolveTranslationProviderOrder,
  resolveTranslationProviderOptions,
  translationMetaForEnvelope,
} from '@/shared/translation/resolveProvider.js';
import {
  buildTranslateParallelLimitSuggestion,
  resolveCliProviderRateLimitProfile,
  resolveCliTranslateMaxParallelEffective,
  resolveCliTranslateRateLimitEffective,
} from '@/shared/translation/resolveTranslateParallel.js';
import {
  createIdentityStreakGuard,
  IdentityAbortError,
  logIdentityStreakAbortNoWriteNotice,
} from '@/shared/translator/identity.js';
import {
  promptLanguageCodeOnly,
  promptMetaLocaleDetails,
  promptFullRetranslate,
  printGenerateSessionBanner,
} from '@/commands/generate/prompts.js';
import { canAsk } from '@/shared/ask/index.js';
import {
  printGenerateFinalizeSummary,
  printPreserveParityReport,
} from '@/commands/generate/summary/index.js';
import type { GenerateOptions } from '@/types/command/generate/index.js';
import type { GenerateJsonPayload, GenerateTargetJsonRow } from '@/types/command/generate/json.js';
import type { Context } from '@/types/core/context/index.js';
import type { Issue } from '@/types/core/json/envelope.js';
import { existsRuntimeFsSync } from '@i18nprune/core';
import { readHostJsonUnknown, writeHostJson } from '@/shared/io/hostJson.js';
import { resolveFromCwd } from '@/utils/paths/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo, canPrintPrimary, canPrintWarn } from '@/utils/logger/policy.js';
import { rows, up } from '@/shared/cursor/index.js';
import { getLanguageByCode } from '@/shared/languages/index.js';
import { languageOftenRtl } from '@i18nprune/core';
import {
  ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES,
  ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT,
} from '@/constants/issueCodes.js';
import { getCliYesFlag } from '@/shared/context/globals.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/shared/result/cliEnvelopeIssues.js';
import { resolveLocalesDynamicSites } from '@/shared/cache/index.js';
import { shouldSkipLocaleMetaSidecar } from '@/shared/locales/sidecar.js';
import {
  assertGenerateTargetCodes,
  parseLocaleCodesList,
  pickTargetSelector,
} from '@i18nprune/core';
import { emitRunEvent, nowMs } from '@i18nprune/core';
import type { RunEmitter, RunEvent } from '@i18nprune/core';
import { classifyProviderFailureOutcome, isRetryableProviderFailure } from '@/shared/translation/providerFallback.js';

/**
 * Core generate workflow (writes locale files unless `dryRun`). Used by the CLI and {@link runGenerate}.
 */
export async function executeGenerate(
  ctx: Context,
  merged: GenerateOptions,
  runtime?: { emit?: RunEmitter; runId?: string },
): Promise<{ payload: GenerateJsonPayload; issues: Issue[] }> {
  const emit = runtime?.emit;
  const runId = runtime?.runId;
  const emitProgress = (
    e: Omit<Extract<RunEvent, { type: 'run.progress.generate' }>, 'op' | 'runId' | 'at'>,
  ): void => {
    emitRunEvent(emit, { op: 'generate', runId, at: nowMs(), ...e });
  };

  emitProgress({ type: 'run.progress.generate', phase: 'scan_dynamic_sites' });
  const dynamicSites = resolveLocalesDynamicSites(ctx);
  if (dynamicSites.length > 0 && canPrintWarn(ctx.run)) {
    logger.warn(
      `${String(dynamicSites.length)} translation call(s) use a non-literal key — generation follows source JSON paths only; computed keys are not enumerated here.`,
      ctx.run,
    );
  }
  const sourcePath = merged.source ? resolveFromCwd(merged.source) : ctx.paths.sourceLocale;
  emitProgress({ type: 'run.progress.generate', phase: 'read_source', label: sourcePath });
  const raw = readHostJsonUnknown(sourcePath, ctx.adapters.fs);
  const sourceLeaves = collectStringLeaves(raw);
  const sourceMap = new Map(sourceLeaves.map((leaf) => [leaf.path, leaf.value]));

  const rawTarget = pickTargetSelector(merged.target);
  if (!rawTarget) {
    if (!canAsk(ctx.run)) {
      throw new I18nPruneError(
        'generate requires --target when running non-interactively (--json or CI)',
        'USAGE',
      );
    }
  }
  const targets = rawTarget
    ? parseLocaleCodesList(rawTarget)
    : [normalizeGeneratePromptLang((await promptLanguageCodeOnly(ctx.run)).trim())];
  if (targets.length === 0) {
    throw new I18nPruneError('generate: no target locale codes provided', 'USAGE');
  }
  emitProgress({ type: 'run.progress.generate', phase: 'resolve_targets', total: targets.length });
  assertGenerateTargetCodes({
    commandName: 'generate',
    codes: targets,
    sourceLocalePath: ctx.paths.sourceLocale,
    path: ctx.adapters.path,
  });
  const skipLocaleMetaSidecar = shouldSkipLocaleMetaSidecar(merged, ctx.config);
  const providerOrder = resolveTranslationProviderOrder(ctx, merged.provider);
  const primaryTranslation = resolveTranslationProviderOptions(ctx, merged.provider);
  assertTranslationProviderCredentialsReady(primaryTranslation);
  const translationMeta = translationMetaForEnvelope(primaryTranslation);
  let totalLeavesProcessed = 0;
  const targetResults: GenerateTargetJsonRow[] = [];
  const streakIssues: Issue[] = [];

  for (const target of targets) {
    emitProgress({ type: 'run.progress.generate', phase: 'build_target', target });
    const targetStarted = Date.now();
    const catalog = getLanguageByCode(target);
    let englishName = merged.englishName ?? catalog?.english ?? target;
    let nativeName = merged.nativeName ?? catalog?.native ?? target;
    let direction: 'ltr' | 'rtl' = resolveGenerateDirectionDefault({
      explicitDirection: merged.direction,
      targetCode: target,
      catalogDirection: catalog?.direction,
    });
    if (canPrintInfo(ctx.run)) {
      const oftenRtl = languageOftenRtl(target);
      if (oftenRtl && direction === 'ltr') {
        logger.warn(
          `generate: "${target}" is often RTL in UIs — direction is ltr. Pass --direction rtl if the locale should be mirrored.`,
          ctx.run,
        );
      } else if (!oftenRtl && direction === 'rtl') {
        logger.warn(
          `generate: "${target}" is usually LTR — confirm --direction rtl is intentional for your app.`,
          ctx.run,
        );
      }
    }
    const targetPath = path.join(ctx.paths.localesDir, `${target}.json`);
    const metaPath = skipLocaleMetaSidecar
      ? null
      : path.join(ctx.paths.localesDir, `${target}.meta.json`);

    // If a sidecar meta already exists, prefer it (avoid re-asking the 3 meta questions).
    if (metaPath !== null && existsRuntimeFsSync(metaPath, ctx.adapters.fs)) {
      const prev = readHostJsonUnknown(metaPath, ctx.adapters.fs);
      if (prev && typeof prev === 'object') {
        const p = prev as { englishName?: unknown; nativeName?: unknown; direction?: unknown };
        if (typeof p.englishName === 'string' && p.englishName.trim() !== '') englishName = p.englishName;
        if (typeof p.nativeName === 'string' && p.nativeName.trim() !== '') nativeName = p.nativeName;
        if (p.direction === 'ltr' || p.direction === 'rtl') direction = p.direction;
      }
    }

    // When `--yes` is set (non-interactive automation), never prompt for meta; use defaults.
    // When interactive, only prompt if no explicit CLI overrides AND no existing meta sidecar.
    if (!getCliYesFlag() && canAsk(ctx.run) && !merged.englishName && !merged.nativeName) {
      const meta = await promptMetaLocaleDetails({ englishName, nativeName, direction }, ctx.run);
      englishName = meta.englishName;
      nativeName = meta.nativeName;
      direction = meta.direction;
    }
    const existingRaw = existsRuntimeFsSync(targetPath, ctx.adapters.fs)
      ? readHostJsonUnknown(targetPath, ctx.adapters.fs)
      : null;
    if (existingRaw && targetLocaleCoversAllSourcePaths(raw, existingRaw) && !merged.force && !merged.dryRun) {
      // `--yes`: never prompt here (same automation rule as meta prompts). Without it, interactive only.
      if (!getCliYesFlag() && canAsk(ctx.run)) {
        const ok = await promptFullRetranslate();
        if (!ok) {
          logger.info(`skipped for ${target} (target already complete).`, ctx.run);
          emitProgress({ type: 'run.progress.generate', phase: 'done', target, label: 'skipped_user_declined' });
          targetResults.push({
            target,
            status: 'skipped_user_declined',
            progress: {
              sourceLeafCount: sourceLeaves.length,
              processedLeafCount: 0,
              translatedLeafCount: 0,
              preserveCount: 0,
              paritySkipCount: 0,
              forced: Boolean(merged.force),
              durationMs: Date.now() - targetStarted,
            },
          });
          continue;
        }
      }
    }
    printGenerateSessionBanner(ctx.run);
    let working: unknown = deepClone(raw);
    let preserveCount = 0;
    let paritySkip = 0;
    let targetStreakIssues: Issue[] = [];
    const providerAttempts: GenerateTargetJsonRow['providerAttempts'] = [];
    let winnerProviderId: GenerateTargetJsonRow['winnerProviderId'];
    let translateResult: Awaited<ReturnType<typeof translateAndNormalizeGenerateLocale>> | undefined;
    let lastErr: unknown;
    let aggTranslateStats = {
      requestAttempts: 0,
      retriesMade: 0,
      successfulLeaves: 0,
      failedRequests: 0,
    };
    for (let pi = 0; pi < providerOrder.length; pi += 1) {
      const providerId = providerOrder[pi]!;
      const translation = resolveTranslationProviderOptionsForId(ctx, providerId);
      assertTranslationProviderCredentialsReady(translation);
      const providerMeta = translationMetaForEnvelope(translation);
      const provider = resolveTranslator(translation);
      const maxParallelTranslates = resolveCliTranslateMaxParallelEffective({
        config: ctx.config,
        workers: merged.workers,
        providerId: translation.provider,
      });
      const providerProfile = resolveCliProviderRateLimitProfile({
        config: ctx.config,
        providerId: translation.provider,
      });
      const rateLimit = resolveCliTranslateRateLimitEffective({
        config: ctx.config,
        providerId: translation.provider,
      });
      const limitSuggestion = buildTranslateParallelLimitSuggestion({
        config: ctx.config,
        workers: merged.workers,
        providerId: translation.provider,
      });
      if (limitSuggestion && canPrintInfo(ctx.run)) logger.warn(limitSuggestion, ctx.run);
      const session = createSessionProgress({ quiet: ctx.run.quiet, json: ctx.run.json });
      const streakGuard = createIdentityStreakGuard(ctx, 'generate', target, {
        pauseClock: () => session.progress.pauseClock?.({ clearBar: false }),
        resumeClock: () => session.progress.resumeClock?.(),
      });
      try {
        emitProgress({
          type: 'run.progress.generate',
          phase: 'translate',
          target,
          total: sourceLeaves.length,
          ...providerMeta,
        });
        translateResult = await translateAndNormalizeGenerateLocale({
          sourceLeaves,
          working,
          existingRaw,
          preserve: ctx.config.policies?.preserve,
          parity: ctx.config.policies?.parity,
          dryRun: Boolean(merged.dryRun),
          force: Boolean(merged.force),
          provider,
          providerId: translation.provider,
          targetLang: target,
          sourceMap,
          tickProgress: createGenerateTickProgressRelay({
            tick: (i, total, p, tickOpts) => session.progress.tick(i, total, p, tickOpts),
            emit,
            runId,
            target,
            translationMeta: providerMeta,
          }),
          onTranslatedLeaf: async (sourceText, translatedText, keyPath) => {
            await streakGuard.onTranslated(sourceText, translatedText, keyPath);
          },
          localeLeafResolve: {
            configMode: merged.metadata ? ctx.config.localeLeaves?.mode : 'legacy_string',
            metadataFlag: merged.metadata === true,
            stripMetadataFlag: false,
          },
          maxParallelTranslates,
          rateLimit,
        });
        working = translateResult.next;
        preserveCount = translateResult.preserveCount;
        paritySkip = translateResult.paritySkip;
        translateResult.translateStats = {
          requestAttempts: aggTranslateStats.requestAttempts + translateResult.translateStats.requestAttempts,
          retriesMade: aggTranslateStats.retriesMade + translateResult.translateStats.retriesMade,
          successfulLeaves: aggTranslateStats.successfulLeaves + translateResult.translateStats.successfulLeaves,
          failedRequests: aggTranslateStats.failedRequests + translateResult.translateStats.failedRequests,
        };
        providerAttempts?.push({ providerId, outcome: 'success' });
        winnerProviderId = providerId;
        targetStreakIssues = streakGuard.flushIssues();
        session.finish();
        if (canPrintInfo(ctx.run)) {
          const wallMs = Date.now() - targetStarted;
          const s = translateResult.translateStats;
          const avgRequestMs = s.requestAttempts > 0 ? Math.round(wallMs / s.requestAttempts) : 0;
          logger.info(
            `progress (${target}): wall=${String(wallMs)}ms · requests=${String(s.requestAttempts)} · success=${String(s.successfulLeaves)} · failed=${String(s.failedRequests)} · retries=${String(s.retriesMade)} · avgRequest=${String(avgRequestMs)}ms`,
            ctx.run,
          );
          logger.info(
            `provider (${target}): id=${translation.provider} · workersRequested=${String(merged.workers ?? maxParallelTranslates)} · workersUsed=${String(maxParallelTranslates)} · maxConcurrency=${String(providerProfile.maxConcurrency)} · rpm=${String(rateLimit?.rpm ?? providerProfile.rpm)} · rps=${String(rateLimit?.rps ?? providerProfile.rps)} · intervalMs=${String(rateLimit?.intervalMs ?? providerProfile.intervalMs)}`,
            ctx.run,
          );
          const translatedLeaves = Math.max(
            0,
            sourceLeaves.length -
              translateResult.preserveCount -
              translateResult.paritySkip -
              translateResult.emptySourceLeafCount,
          );
          logger.info(
            `leaves (${target}): translated=${String(translatedLeaves)} · needsReview=${String(translateResult.markedForReview)}`,
            ctx.run,
          );
        }
        break;
      } catch (e) {
        session.fail();
        const rootCause = e instanceof TranslateRunInterruptedError ? e.cause : e;
        providerAttempts?.push({
          providerId,
          outcome: classifyProviderFailureOutcome(rootCause),
        });
        if (rootCause instanceof IdentityAbortError) {
          logIdentityStreakAbortNoWriteNotice(ctx, rootCause, {
            dryRun: Boolean(merged.dryRun),
            commandDisplay: 'generate',
          });
          const issues = [
            ...streakGuard.flushIssues(),
            {
              severity: 'error',
              code: ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT,
              message: rootCause.message,
              docPath: issueCodeRepoDocPathForIssueCode(ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT),
            },
          ] as Issue[];
          (rootCause as Error & { issues?: Issue[] }).issues = issues;
        }
        lastErr = rootCause;
        if (e instanceof TranslateRunInterruptedError) {
          working = e.partialLocaleJson;
          aggTranslateStats = {
            requestAttempts: aggTranslateStats.requestAttempts + e.translateStats.requestAttempts,
            retriesMade: aggTranslateStats.retriesMade + e.translateStats.retriesMade,
            successfulLeaves: aggTranslateStats.successfulLeaves + e.translateStats.successfulLeaves,
            failedRequests: aggTranslateStats.failedRequests + e.translateStats.failedRequests,
          };
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
    if (!translateResult) throw (lastErr ?? new Error('generate: provider fallback exhausted without a result'));
    streakIssues.push(...targetStreakIssues);
    const emptyIssueList = translateResult!.issues ?? [];
    for (const issue of emptyIssueList) {
      streakIssues.push(issue);
      if (issue.code === ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES && canPrintInfo(ctx.run)) {
        logger.warn(issue.message, ctx.run);
      }
    }
    const modeDecision = translateResult!.modeDecision;
    const normalizedReport = translateResult!.report;
    if (!merged.dryRun) {
      emitProgress({ type: 'run.progress.generate', phase: 'write_files', target, label: targetPath });
      writeHostJson(targetPath, working, ctx.adapters.fs);
      if (metaPath !== null) {
        emitProgress({ type: 'run.progress.generate', phase: 'write_files', target, label: metaPath });
        writeHostJson(metaPath, { lang: target, englishName, nativeName, direction }, ctx.adapters.fs);
      }
    }
    printPreserveParityReport(preserveCount, paritySkip, ctx.run);
    if (canPrintPrimary(ctx.run) || (merged.dryRun && canPrintInfo(ctx.run))) {
      printGenerateFinalizeSummary(
        {
          target,
          englishName,
          nativeName,
          direction,
          targetPath,
          metaPath,
          leafCount: sourceLeaves.length,
          showMeta: true,
          dryRun: merged.dryRun,
        },
        ctx.run,
      );
    }
    totalLeavesProcessed += sourceLeaves.length;
    targetResults.push({
      target,
      status: merged.dryRun ? 'dry_run' : 'written',
      sourceLeafCount: sourceLeaves.length,
      preserveCount,
      paritySkip,
      progress: {
        sourceLeafCount: sourceLeaves.length,
        processedLeafCount: sourceLeaves.length,
        translatedLeafCount: Math.max(
          0,
          sourceLeaves.length -
            preserveCount -
            paritySkip -
            translateResult!.emptySourceLeafCount,
        ),
        preserveCount,
        paritySkipCount: paritySkip,
        forced: Boolean(merged.force),
        durationMs: Date.now() - targetStarted,
        requestAttempts: translateResult!.translateStats.requestAttempts,
        requestRetries: translateResult!.translateStats.retriesMade,
        requestSuccesses: translateResult!.translateStats.successfulLeaves,
        requestFailures: translateResult!.translateStats.failedRequests,
      },
      providerAttempts,
      winnerProviderId,
      fallbackCount: Math.max(0, (providerAttempts?.length ?? 0) - 1),
      markedForReview: translateResult!.markedForReview,
      paths: { localeJson: targetPath, metaJson: metaPath },
      localeMetadata: normalizedReport,
    });
    if (canPrintInfo(ctx.run)) {
      const route = (providerAttempts ?? []).map((a) => a.providerId).join(' -> ');
      logger.info(
        `provider route (${target}): ${route} (winner: ${winnerProviderId ?? 'none'}, fallbacks: ${String(Math.max(0, (providerAttempts?.length ?? 0) - 1))})`,
        ctx.run,
      );
    }
    if (modeDecision.mode === 'structured' && canPrintInfo(ctx.run)) {
      logger.info(
        `metadata for ${target}: structured ${String(normalizedReport.structuredLeavesWritten)}, repaired ${String(normalizedReport.repairedCorruptLeaves)}. Use "sync --strip-metadata" to remove metadata fields later.`,
        ctx.run,
      );
    }
  }
  emitProgress({ type: 'run.progress.generate', phase: 'done' });

  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSites.length),
    streakIssues,
  );

  const payload: GenerateJsonPayload = {
    kind: 'generate',
    providerId: translationMeta.providerId,
    dryRun: Boolean(merged.dryRun),
    force: Boolean(merged.force),
    targets: targets.slice(),
    dynamicKeySites: dynamicSites.length,
    leavesProcessed: totalLeavesProcessed,
    targetResults,
  };

  return { payload, issues };
}

export function resolveGenerateDirectionDefault(input: {
  explicitDirection?: 'ltr' | 'rtl';
  targetCode: string;
  catalogDirection?: unknown;
}): 'ltr' | 'rtl' {
  if (input.explicitDirection === 'ltr' || input.explicitDirection === 'rtl') return input.explicitDirection;
  if (input.catalogDirection === 'ltr' || input.catalogDirection === 'rtl') return input.catalogDirection;
  return languageOftenRtl(input.targetCode) ? 'rtl' : 'ltr';
}
