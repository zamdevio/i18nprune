/**
 * **`generate --resume`** per-target orchestration: review-leaf scan, translate stale paths, normalize,
 * write. Provider fallback retries provider-retryable failures only.
 */

import { collectTranslationSurfaceLeaves } from '../../shared/localeLeaves/index.js';
import {
  assertTranslationProviderCredentialsReady,
  resolveTranslationProviderOptionsForId,
  resolveTranslationProviderOrder,
} from '../../translator/providers/options.js';
import { resolveTranslator, translationRunMeta } from '../../shared/translator/providers/registry.js';
import {
  buildTranslateParallelLimitSuggestion,
  resolveProviderRateLimitProfile,
  resolveTranslateMaxParallelEffective,
  resolveTranslateRateLimitEffective,
} from '../../translator/limits/parallel.js';
import { classifyProviderFailureOutcome, isRetryableProviderFailure } from '../../translator/policy/fallback.js';
import { TranslateRunInterruptedError } from '../../translator/errors/interrupted.js';
import { IdentityAbortError } from '../../translator/identity/error.js';
import { issueCodeRepoDocPathForIssueCode } from '../../shared/docs/issueAnchors.js';
import { ISSUE_LOCALE_TARGET_NOT_FOUND, ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT } from '../../shared/constants/issueCodes.js';
import { I18nPruneError } from '../../shared/errors/index.js';
import { applyLocaleLeafNormalization } from '../../shared/localeLeaves/index.js';
import { emitRunMessage } from '../../shared/run/index.js';
import { existsRuntimeFsSync } from '../../runtime/helpers/sync/fs.js';
import { readJsonFromRuntimeFsSync } from '../../runtime/helpers/sync/readJson.js';
import { writeRuntimeJsonPretty } from '../io/writeRuntimeJson.js';
import { listResumeTranslationJobs, translateResumeCandidateLeaves } from '../localeTranslate.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { TranslationProviderId } from '../../types/translator/providers.js';
import type { CoreContext } from '../../types/generate/generateRun.js';
import type { GenerateHostHooks, GenerateRunOptions } from '../../types/generate/index.js';
import type { GenerateTargetJsonRow } from '../../types/generate/generateRun.js';
import type { LocaleMetadataReport } from '../../types/localeLeaves/index.js';
import type { EffectiveReferenceConfig } from '../../types/reference/index.js';
import type { GenerateResumeRefContext } from '../../types/generate/resumeCandidates.js';

export type RunGenerateResumeLocaleInput = {
  ctx: CoreContext;
  opts: GenerateRunOptions;
  host: GenerateHostHooks;
  target: string;
  sourceMap: Map<string, string>;
  eff: EffectiveReferenceConfig;
  refCtx: GenerateResumeRefContext;
  targetPath: string;
  metaPath: string | null;
  englishName: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  targetStarted: number;
};

function emitGenerateMessage(host: Pick<GenerateHostHooks, 'emit' | 'runId'>, level: 'info' | 'notice' | 'warn', message: string): void {
  emitRunMessage(host.emit, { op: 'generate', runId: host.runId, level, message });
}

export async function runGenerateResumeLocale(input: RunGenerateResumeLocaleInput): Promise<{
  row: GenerateTargetJsonRow;
  issues: Issue[];
  leavesProcessed: number;
}> {
  const { ctx, opts, host, target, sourceMap, eff, refCtx, targetPath, metaPath, englishName, nativeName, direction } =
    input;
  const { fs } = ctx.adapters;
  if (!existsRuntimeFsSync(targetPath, fs)) {
    throw new I18nPruneError(`generate: locale file missing for --resume: ${targetPath}`, 'USAGE', {
      issueCode: ISSUE_LOCALE_TARGET_NOT_FOUND,
    });
  }
  const targetRaw = readJsonFromRuntimeFsSync(targetPath, fs);
  const tLeaves = collectTranslationSurfaceLeaves(targetRaw);
  const translateCfg = ctx.config.translate;
  if (!translateCfg) {
    throw new I18nPruneError('config.translate is required for generate --resume', 'USAGE');
  }
  const chain: TranslationProviderId[] = [
    ...resolveTranslationProviderOrder({
      config: translateCfg,
      pin: opts.provider,
      env: ctx.env,
    }),
  ];

  const emitProgress = host.emitProgress;
  let lastErr: unknown;
  let perTargetStreakIssues: Issue[] = [];
  let result:
    | {
        updated: number;
        markedForReview: number;
        localeMetadata: LocaleMetadataReport;
        progress: NonNullable<GenerateTargetJsonRow['progress']>;
      }
    | undefined;
  const providerAttempts: GenerateTargetJsonRow['providerAttempts'] = [];
  let winnerProviderId: GenerateTargetJsonRow['winnerProviderId'];
  let resumeLocaleJson: unknown | undefined;

  for (let pi = 0; pi < chain.length; pi += 1) {
    const providerId = chain[pi]!;
    const translation = resolveTranslationProviderOptionsForId({
      config: translateCfg,
      id: providerId,
      env: ctx.env,
    });
    assertTranslationProviderCredentialsReady(translation);
    const providerMeta = translationRunMeta(translation);
    const provider = resolveTranslator(translation);
    const maxParallelTranslates = resolveTranslateMaxParallelEffective({
      config: translateCfg,
      workers: opts.workers,
      providerId: translation.provider,
      env: ctx.env,
    });
    const providerProfile = resolveProviderRateLimitProfile({
      config: translateCfg,
      providerId: translation.provider,
    });
    const rateLimit = resolveTranslateRateLimitEffective({
      config: translateCfg,
      providerId: translation.provider,
    });
    const limitSuggestion = buildTranslateParallelLimitSuggestion({
      config: translateCfg,
      workers: opts.workers,
      providerId: translation.provider,
      env: ctx.env,
    });
    if (limitSuggestion) emitGenerateMessage(host, 'notice', limitSuggestion);

    const session = host.createSession();
    const streakGuard = host.createIdentityStreakGuard(target, {
      pauseClock: () => session.progress.pauseClock?.({ clearBar: false }),
      resumeClock: () => session.progress.resumeClock?.(),
    });

    try {
      const resumePlan = listResumeTranslationJobs({
        tLeaves,
        next: resumeLocaleJson ?? targetRaw,
        sourceMap,
        refCtx,
        eff,
        preserve: ctx.config.policies?.preserve,
        parity: ctx.config.policies?.parity,
        dryRun: Boolean(opts.dryRun),
      });
      const resumeTranslateTotal = opts.dryRun
        ? resumePlan.dryRunCandidateCount
        : resumePlan.jobs.length;
      emitProgress({
        type: 'run.progress.generate',
        phase: 'translate',
        target,
        total: resumeTranslateTotal,
        ...providerMeta,
      });
      let next: unknown = resumeLocaleJson ?? targetRaw;
      resumeLocaleJson = undefined;
      let changed = 0;
      let translateStats = {
        requestAttempts: 0,
        retriesMade: 0,
        successfulLeaves: 0,
        failedRequests: 0,
      };
      let markedForReview = 0;

      const filled = await translateResumeCandidateLeaves({
        tLeaves,
        next,
        sourceMap,
        refCtx,
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
        tickProgress: host.buildTickProgressRelay({
          tick: (i, total, p, tickOpts) => session.progress.tick(i, total, p, tickOpts),
          target,
          translationMeta: providerMeta,
        }),
        onTranslatedLeaf: async (sourceText, translatedText, keyPath) => {
          await streakGuard.onTranslated(sourceText, translatedText, keyPath);
        },
      });
      next = filled.next;
      changed = filled.changed;
      translateStats = filled.translateStats;
      markedForReview = filled.markedForReview;

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
      const localeWouldChange = JSON.stringify(targetRaw) !== JSON.stringify(next);

      if (!opts.dryRun && localeWouldChange) {
        emitProgress({ type: 'run.progress.generate', phase: 'write_files', target, label: targetPath });
        writeRuntimeJsonPretty(targetPath, next, ctx.adapters);
        if (metaPath !== null) {
          emitProgress({ type: 'run.progress.generate', phase: 'write_files', target, label: metaPath });
          writeRuntimeJsonPretty(metaPath, { lang: target, englishName, nativeName, direction }, ctx.adapters);
        }
      }

      providerAttempts?.push({ providerId, outcome: 'success' });
      winnerProviderId = providerId;
      perTargetStreakIssues = streakGuard.flushIssues();
      session.finish();

      const wallMs = Date.now() - input.targetStarted;
      const avgRequestMs = translateStats.requestAttempts > 0 ? Math.round(wallMs / translateStats.requestAttempts) : 0;
      emitGenerateMessage(
        host,
        'info',
        `progress (${target}): wall=${String(wallMs)}ms · requests=${String(translateStats.requestAttempts)} · success=${String(translateStats.successfulLeaves)} · failed=${String(translateStats.failedRequests)} · retries=${String(translateStats.retriesMade)} · avgRequest=${String(avgRequestMs)}ms`,
      );
      emitGenerateMessage(
        host,
        'info',
        `provider (${target}): id=${translation.provider} · workersRequested=${String(opts.workers ?? maxParallelTranslates)} · workersUsed=${String(maxParallelTranslates)} · maxConcurrency=${String(providerProfile.maxConcurrency)} · rpm=${String(rateLimit?.rpm ?? providerProfile.rpm)} · rps=${String(rateLimit?.rps ?? providerProfile.rps)} · intervalMs=${String(rateLimit?.intervalMs ?? providerProfile.intervalMs)}`,
      );
      emitGenerateMessage(
        host,
        'info',
        `leaves (${target}): valuesUpdated=${String(changed)} · needsReview=${String(markedForReview)}`,
      );

      if (normalized.modeDecision.mode === 'structured') {
        emitGenerateMessage(
          host,
          'info',
          `metadata for ${target}: structured ${String(normalized.report.structuredLeavesWritten)}, repaired ${String(normalized.report.repairedCorruptLeaves)}. Use "sync --strip-metadata" to remove metadata fields later.`,
        );
      }

      result = {
        updated: changed,
        markedForReview,
        localeMetadata: normalized.report,
        progress: {
          sourceLeafCount: sourceMap.size,
          processedLeafCount: tLeaves.length,
          translatedLeafCount: changed,
          updatedLeafCount: changed,
          durationMs: Date.now() - input.targetStarted,
          requestAttempts: translateStats.requestAttempts,
          requestRetries: translateStats.retriesMade,
          requestSuccesses: translateStats.successfulLeaves,
          requestFailures: translateStats.failedRequests,
        },
      };
      break;
    } catch (e: unknown) {
      session.fail();
      const rootCause = e instanceof TranslateRunInterruptedError ? e.cause : e;
      providerAttempts?.push({
        providerId,
        outcome: classifyProviderFailureOutcome(rootCause),
      });
      if (rootCause instanceof IdentityAbortError) {
        host.onIdentityAbortNotice(rootCause, { dryRun: Boolean(opts.dryRun) });
        const issuesAbort = [
          ...streakGuard.flushIssues(),
          {
            severity: 'error' as const,
            code: ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT,
            message: rootCause.message,
            docPath: issueCodeRepoDocPathForIssueCode(ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT),
          },
        ] satisfies Issue[];
        (rootCause as Error & { issues?: Issue[] }).issues = issuesAbort;
      }
      lastErr = rootCause;
      if (e instanceof TranslateRunInterruptedError) {
        resumeLocaleJson = e.partialLocaleJson;
      }
      const hasNext = pi < chain.length - 1;
      if (!hasNext || !isRetryableProviderFailure(rootCause)) {
        throw rootCause instanceof Error ? rootCause : e;
      }
      host.beforeProviderFallbackWarn?.();
      const nextProvider = chain[pi + 1]!;
      const partialHint =
        e instanceof TranslateRunInterruptedError
          ? ` Partial progress kept (${String(e.translateStats.successfulLeaves)} leaf translation(s) succeeded before interrupt); next provider continues without restarting.`
          : '';
      emitGenerateMessage(
        host,
        'warn',
        `provider "${providerId}" failed with a retryable backend error; retrying target "${target}" with "${nextProvider}".${partialHint}`,
      );
    }
  }

  if (!result) {
    throw lastErr instanceof Error
      ? lastErr
      : new Error(String(lastErr ?? 'generate --resume: provider chain exhausted'));
  }

  const row: GenerateTargetJsonRow = {
    target,
    status: opts.dryRun ? 'dry_run' : 'written',
    resumeUpdatedLeafCount: result.updated,
    sourceLeafCount: sourceMap.size,
    preserveCount: 0,
    paritySkip: 0,
    progress: result.progress,
    providerAttempts,
    winnerProviderId,
    fallbackCount: Math.max(0, (providerAttempts?.length ?? 0) - 1),
    markedForReview: result.markedForReview,
    paths: { localeJson: targetPath, metaJson: metaPath },
    localeMetadata: result.localeMetadata,
  };

  {
    const route = (providerAttempts ?? []).map((a) => a.providerId).join(' -> ');
    emitGenerateMessage(
      host,
      'info',
      `provider route (${target}): ${route} (winner: ${winnerProviderId ?? 'none'}, fallbacks: ${String(Math.max(0, (providerAttempts?.length ?? 0) - 1))})`,
    );
  }

  return { row, issues: perTargetStreakIssues, leavesProcessed: tLeaves.length };
}
