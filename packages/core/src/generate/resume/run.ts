/**
 * **`generate --resume`** per-target orchestration: review-leaf scan, translate stale paths, normalize,
 * write. Provider fallback retries provider-retryable failures only.
 */

import { collectTranslationSurfaceLeaves } from '../../shared/locales/leaves/index.js';
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
import { classifyProviderFailureOutcome, isRetryableProviderFailure } from '../../translator/policy/index.js';
import { TranslateRunInterruptedError } from '../../translator/errors/interrupted.js';
import { IdentityAbortError } from '../../translator/identity/error.js';
import { issueCodeRepoDocPathForIssueCode } from '../../shared/docs/issueAnchors.js';
import { ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT } from '../../shared/constants/issueCodes.js';
import { I18nPruneError } from '../../shared/errors/index.js';
import { applyLocaleLeafNormalization } from '../../shared/locales/leaves/index.js';
import { localeJsonContentEquals } from '../../shared/json/sortKeys.js';
import { normalizeLocaleDocumentToNestedCanonical } from '../../shared/json/localeLeafPath.js';
import { emitRunMessage } from '../../shared/run/index.js';
import { existsRuntimeFsSync } from '../../runtime/helpers/sync/fs.js';
import { readLocaleCodeSurfaceFromContext, readLocaleJsonFromContextSync, writeLocaleJsonFromContextSync } from '../../shared/locales/index.js';
import {
  localeJsonFromTranslationSurfaceLeaves,
  materializeGenerateWorkingBySegment,
  sourceLocaleCodeFromContext,
} from '../../shared/locales/targets/index.js';
import { formatGenerateTranslateProgress } from '../translateProgressSummary.js';
import { listResumeTranslationJobs, translateResumeCandidateLeaves } from '../localeTranslate.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { TranslationProviderId } from '../../types/translator/providers.js';
import type {
  GenerateHostHooks,
  GenerateTargetJsonRow,
  RunGenerateResumeLocaleInput,
} from '../../types/generate/index.js';
import type { LocaleMetadataReport } from '../../types/locales/leaves/index.js';
import type { TranslationSurfaceLeaf } from '../../types/locales/leaves/translationSurface.js';

function emitGenerateMessage(host: Pick<GenerateHostHooks, 'emit' | 'runId'>, level: 'info' | 'notice' | 'warn', message: string): void {
  emitRunMessage(host.emit, { op: 'generate', runId: host.runId, level, message });
}

export async function runGenerateResumeLocale(input: RunGenerateResumeLocaleInput): Promise<{
  row: GenerateTargetJsonRow;
  issues: Issue[];
  leavesProcessed: number;
}> {
  const { ctx, opts, host, target, sourceMap, sourceLeaves, eff, refCtx, targetPath, writePlan, translationCache } =
    input;
  const { fs } = ctx.adapters;
  const targetMissing = !writePlan.segments.some((s) => existsRuntimeFsSync(s.absolutePath, fs));
  let targetRaw: unknown = {};
  if (!targetMissing) {
    if (writePlan.layout.mode === 'flat_file') {
      targetRaw = readLocaleJsonFromContextSync(ctx, targetPath);
    } else {
      const read = readLocaleCodeSurfaceFromContext(ctx, target);
      targetRaw = read.ok && read.leaves.length > 0 ? localeJsonFromTranslationSurfaceLeaves(read.leaves) : {};
    }
  }
  const resumeLeafPaths = sourceLeaves.map((leaf) => leaf.path);
  targetRaw = normalizeLocaleDocumentToNestedCanonical(targetRaw, resumeLeafPaths);
  let tLeaves = collectTranslationSurfaceLeaves(targetRaw);
  if (targetMissing && tLeaves.length === 0 && sourceMap.size > 0) {
    emitGenerateMessage(
      host,
      'info',
      `generate (${target}): target locale file not found — treating source strings as stale for --resume (same as a new target).`,
    );
    tLeaves = Array.from(sourceMap.entries()).map(
      ([path, value]): TranslationSurfaceLeaf => ({
        path,
        value,
        shape: 'legacy_string',
        confidence: null,
        needsReview: null,
      }),
    );
  }
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
        cacheHits: 0,
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
        sourceLang: 'en',
        translationCache,
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
      const localeWouldChange = !localeJsonContentEquals(targetRaw, next);

      if (!opts.dryRun && localeWouldChange) {
        const parts = materializeGenerateWorkingBySegment({
          working: next,
          sourceLeaves,
          segments: writePlan.segments,
          structure: writePlan.layout.structure,
          sourceLocaleCode: sourceLocaleCodeFromContext(ctx),
          layout: writePlan.layout,
          fs: ctx.adapters.fs,
          path: ctx.adapters.path,
        });
        for (const { segment, document } of parts) {
          emitProgress({ type: 'run.progress.generate', phase: 'write_files', target, label: segment.absolutePath });
          writeLocaleJsonFromContextSync(ctx, segment.absolutePath, document);
        }
      }

      providerAttempts?.push({ providerId, outcome: 'success' });
      winnerProviderId = providerId;
      perTargetStreakIssues = streakGuard.flushIssues();
      session.finish();

      const wallMs = Date.now() - input.targetStarted;
      emitGenerateMessage(host, 'info', formatGenerateTranslateProgress(target, wallMs, translateStats));
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
    paths:
      writePlan.segments.length > 1
        ? { localeJsonPaths: writePlan.segments.map((segment) => segment.absolutePath) }
        : { localeJson: targetPath },
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
