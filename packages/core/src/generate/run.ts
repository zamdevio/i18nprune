/**
 * Public **`runGenerate`** — project-scoped generate: read source locale, walk targets, run per-provider
 * translate+normalize, write files. Host supplies TTY / prompts / progress via {@link GenerateHostHooks}.
 */

import { buildLanguageCatalog, generatedLanguageCatalog, getLanguageByCodeFromCatalog } from '../shared/languages/catalog/index.js';
import { resolveGenerateLocaleDisplay } from '../shared/languages/resolveGenerateLocaleDisplay.js';
import { languageOftenRtl } from '../shared/languages/rtlHint.js';
import { collectTranslationSurfaceLeaves } from '../shared/locales/leaves/index.js';
import { targetLocaleCoversAllSourcePaths } from '../shared/json/targetCoverage.js';
import { readLocaleJsonFromContextSync, writeLocaleJsonFromContextSync } from '../shared/locales/index.js';
import { resolvePrimaryTargetWritePath } from '../shared/locales/targets/index.js';
import { existsRuntimeFsSync } from '../runtime/helpers/sync/fs.js';
import { assertGenerateTargetCodes } from '../locales/generateTargets.js';
import { issueCodeRepoDocPathForIssueCode } from '../shared/docs/issueAnchors.js';
import {
  ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES,
  ISSUE_TRANSLATE_HANDOFF_NO_ELIGIBLE_PROVIDER,
  ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT,
} from '../shared/constants/issueCodes.js';
import { I18nPruneError } from '../shared/errors/index.js';
import { finalizePartialTranslatedLocaleForGenerate, translateAndNormalizeGenerateLocale } from './normalize.js';
import { TranslateRunInterruptedError } from '../translator/errors/interrupted.js';
import { resolveTranslator, translationRunMeta } from '../shared/translator/providers/registry.js';
import {
  assertTranslationProviderCredentialsReady,
  resolveTranslationProviderOptions,
  resolveTranslationProviderOptionsForId,
  resolveTranslationProviderOrder,
} from '../translator/providers/options.js';
import {
  buildTranslateParallelLimitSuggestion,
  resolveProviderRateLimitProfile,
  resolveTranslateMaxParallelEffective,
  resolveTranslateRateLimitEffective,
} from '../translator/limits/parallel.js';
import { classifyProviderFailureOutcome, isRetryableProviderFailure } from '../translator/policy/fallback.js';
import { classifyTranslateFailure } from '../translator/policy/classify.js';
import {
  buildHandoffCatalogEligible,
  prioritizeProviderAfter,
  shouldOfferHandoffInteractivePrompt,
  shouldWarnAndAbortHandoffOnNonTty,
  synthesizeHandoffTranslationOptions,
} from '../translator/policy/handoff.js';
import { resolveProviderActionFor } from '../translator/policy/resolver.js';
import type { TranslatePolicyVerb } from '../types/translator/policy.js';
import { TRANSLATE_POLICY_DEFAULTS } from '../types/translator/policy.js';
import { createProviderHealthMonitor } from '../shared/translator/utils/providerHealth.js';
import { IdentityAbortError } from '../translator/identity/error.js';
import type { IdentityStreakGuard } from '../translator/identity/guard.js';
import { runGenerateResumeLocale } from './resume/run.js';
import {
  bindGenerateTranslateCache,
  createGenerateTranslateCache,
  flushTranslateCacheL2,
  openTranslateCacheL2ForTarget,
} from '../translator/cache/index.js';
import { formatGenerateTranslateProgress } from './translateProgressSummary.js';
import { resolveReferenceConfig } from '../shared/reference/resolveConfig.js';
import { emitRunMessage } from '../shared/run/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import type { TranslationProviderId } from '../types/translator/providers.js';
import type { CoreContext } from '../types/context/index.js';
import { resolveProjectAnalysis } from '../analysis/index.js';
import type {
  GenerateHostHooks,
  GenerateJsonPayload,
  GenerateRunOptions,
  GenerateRunResult,
  GenerateTargetJsonRow,
  GenerateRunHooks,
  HandoffOffer,
  IncompleteRunDecision,
  IncompleteRunInfo,
  IncompleteRunReason,
} from '../types/generate/index.js';

const LANG_CATALOG = buildLanguageCatalog(generatedLanguageCatalog);

function emitGenerateMessage(host: Pick<GenerateHostHooks, 'emit' | 'runId'>, level: 'info' | 'notice' | 'warn', message: string): void {
  emitRunMessage(host.emit, { op: 'generate', runId: host.runId, level, message });
}

function resolveGenerateSourcePath(ctx: CoreContext, sourceOverride: string | undefined): string {
  if (sourceOverride === undefined || sourceOverride === '') return ctx.paths.sourceLocale;
  const cwd = ctx.adapters.system.cwd();
  return ctx.adapters.path.isAbsolute(sourceOverride)
    ? sourceOverride
    : ctx.adapters.path.resolve(cwd, sourceOverride);
}

/**
 * Best-effort error summary for {@link IncompleteRunInfo.lastError}. Prefer the first issue code
 * attached by **`translateLeaf`**'s structured failures; fall back to **`I18nPruneError.code`**;
 * default to **`'unknown'`** so SDK consumers always see a stable shape.
 */
function summarizeLastError(err: unknown): { code: string; message: string } | undefined {
  if (err === undefined || err === null) return undefined;
  const e = err as { code?: unknown; issues?: unknown };
  const issuesArr = Array.isArray(e.issues) ? (e.issues as Issue[]) : [];
  const issueCode = issuesArr[0]?.code;
  const code = typeof issueCode === 'string'
    ? issueCode
    : typeof e.code === 'string'
      ? e.code
      : 'unknown';
  const message = err instanceof Error ? err.message : String(err);
  return { code, message };
}

export async function runGenerate(
  ctx: CoreContext,
  opts: GenerateRunOptions,
  host: GenerateHostHooks,
  hooks?: GenerateRunHooks,
): Promise<GenerateRunResult> {
  const emitProgress = host.emitProgress;

  const analysis = resolveProjectAnalysis(ctx, { emit: host.emit, op: 'generate', runId: host.runId });
  const schemaPaths = analysis.usage.resolvedKeys;

  const sourcePath = resolveGenerateSourcePath(ctx, opts.source);
  let raw: unknown;
  if (opts.preloadedRaw !== undefined) {
    raw = opts.preloadedRaw;
  } else {
    emitProgress({ type: 'run.progress.generate', phase: 'read_source', label: sourcePath });
    raw = readLocaleJsonFromContextSync(ctx, sourcePath);
  }
  const allSourceLeaves = collectTranslationSurfaceLeaves(raw);
  const sourceLeaves =
    schemaPaths.size > 0
      ? allSourceLeaves.filter((l) => schemaPaths.has(l.path))
      : allSourceLeaves;
  const sourceMap = new Map(sourceLeaves.map((leaf) => [leaf.path, leaf.value]));

  const targets = [...opts.targets];
  if (targets.length === 0) {
    throw new I18nPruneError('generate: no target locale codes provided', 'USAGE');
  }
  if (opts.resume === true && opts.resumeReference === undefined) {
    throw new I18nPruneError('generate --resume requires internal resumeReference (host wiring bug)', 'USAGE');
  }
  if (opts.resume === true && opts.force === true) {
    throw new I18nPruneError(
      'generate --resume does not support --force: resume only translates eligible stale/review leaves. Use generate --force without --resume to re-translate all leaves.',
      'USAGE',
    );
  }

  emitProgress({ type: 'run.progress.generate', phase: 'resolve_targets', total: targets.length });
  assertGenerateTargetCodes({
    commandName: 'generate',
    codes: targets,
    sourceLocalePath: ctx.paths.sourceLocale,
    path: ctx.adapters.path,
  });

  const translateCfg = ctx.config.translate;
  if (!translateCfg) {
    throw new I18nPruneError('config.translate is required for generate', 'USAGE');
  }
  const chain: TranslationProviderId[] = [
    ...resolveTranslationProviderOrder({
      config: translateCfg,
      pin: opts.provider,
      env: ctx.env,
    }),
  ];
  const primaryTranslation = resolveTranslationProviderOptions({
    config: translateCfg,
    pin: opts.provider,
    env: ctx.env,
  });
  assertTranslationProviderCredentialsReady(primaryTranslation);
  const translationMeta = translationRunMeta(primaryTranslation);

  const { cache: translateCacheBase } = createGenerateTranslateCache(ctx, { bypassL2: opts.force === true });

  // Translate-policy substrate (steps 4–6 of `translate-policy (shipped)`).
  // One health monitor per run; resolver consults it on every backoff verb.
  const effectivePolicy = { ...TRANSLATE_POLICY_DEFAULTS, ...(translateCfg.policy ?? {}) };
  const maxAttemptsTotal = Math.max(1, effectivePolicy.maxAttempts ?? chain.length);
  // Plan §7: per-provider escalation threshold = ceil(maxAttempts / chain.length).
  // With defaults (maxAttempts = providers.length), this yields 1 — "one shot per provider".
  const escalationThreshold = Math.max(1, Math.ceil(maxAttemptsTotal / Math.max(1, chain.length)));
  const health = createProviderHealthMonitor();

  let totalLeavesProcessed = 0;
  const targetResults: GenerateTargetJsonRow[] = [];
  const streakIssues: Issue[] = [];
  let generatePayloadPartial = false;
  let generatePayloadPartialMarkedSum = 0;

  for (const target of targets) {
    emitProgress({ type: 'run.progress.generate', phase: 'build_target', target });
    const targetStarted = Date.now();
    const catalog = getLanguageByCodeFromCatalog(LANG_CATALOG, target);
    const { englishName, nativeName, direction } = resolveGenerateLocaleDisplay(target, catalog);
    {
      const oftenRtl = languageOftenRtl(target);
      if (oftenRtl && direction === 'ltr') {
        emitGenerateMessage(
          host,
          'notice',
          `generate: "${target}" is often RTL in UIs — catalog direction is ltr. Set direction in \`src/i18n/config.json\` (patch) if your app mirrors RTL.`,
        );
      } else if (!oftenRtl && direction === 'rtl') {
        emitGenerateMessage(
          host,
          'notice',
          `generate: "${target}" is usually LTR — catalog direction is rtl; confirm that matches your app.`,
        );
      }
    }

    const targetPath = resolvePrimaryTargetWritePath(ctx, target);
    const targetJsonExists = existsRuntimeFsSync(targetPath, ctx.adapters.fs);

    const existingRaw = targetJsonExists ? readLocaleJsonFromContextSync(ctx, targetPath) : null;
    let forceTarget = Boolean(opts.force);
    let forceReason: 'flag' | 'prompt' | undefined = forceTarget ? 'flag' : undefined;

    if (
      !opts.resume &&
      existingRaw &&
      targetLocaleCoversAllSourcePaths(raw, existingRaw) &&
      !forceTarget &&
      !opts.dryRun
    ) {
      if (!host.shouldSkipInteractivePrompts() && host.canAskInteractive()) {
        const ok = await host.promptFullRetranslate();
        if (!ok) {
          emitGenerateMessage(host, 'info', `skipped for ${target} (target already complete).`);
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
              forced: Boolean(opts.force),
              durationMs: Date.now() - targetStarted,
            },
          });
          continue;
        }
        forceTarget = true;
        forceReason = 'prompt';
      }
    }

    const { l2: targetL2 } = openTranslateCacheL2ForTarget(ctx, target, { bypassL2: opts.force === true });
    const translationCache = bindGenerateTranslateCache(translateCacheBase, targetL2);

    try {
    if (opts.resume) {
      const eff = resolveReferenceConfig('generate', ctx.config);
      emitGenerateMessage(host, 'info', `generate (${target}): translating string leaves (schema leaf paths; canonical nested output).`);
      const { row, issues: resumeIssues, leavesProcessed: resumeLeaves } = await runGenerateResumeLocale({
        ctx,
        opts,
        host,
        target,
        sourceMap,
        eff,
        refCtx: opts.resumeReference!,
        targetPath,
        targetStarted,
        translationCache,
      });
      streakIssues.push(...resumeIssues);
      totalLeavesProcessed += resumeLeaves;
      targetResults.push(row);
      host.printPreserveParityReport(0, 0);
      host.printFinalizeSummary({
        target,
        englishName,
        nativeName,
        direction,
        targetPath,
        leafCount: row.progress?.processedLeafCount ?? 0,
        dryRun: opts.dryRun,
      });
      continue;
    }

    emitGenerateMessage(host, 'info', `generate (${target}): translating string leaves (schema leaf paths; canonical nested output).`);
    if (forceReason === 'flag') {
      emitGenerateMessage(
        host,
        'info',
        `generate (${target}): --force enabled — complete-target prompt skipped; existing target strings will be re-translated where policies allow.`,
      );
    } else if (forceReason === 'prompt') {
      emitGenerateMessage(
        host,
        'info',
        `generate (${target}): full re-translate confirmed — existing target strings will be re-translated for this target where policies allow.`,
      );
    }
    // Schema-first: only write leaves that are translated/preserved; do not mirror source locale structure.
    let working: unknown = {};
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
      cacheHits: 0,
    };

    let pi = 0;
    let attemptsRemaining = maxAttemptsTotal;
    /** After an interactive handoff pick, one attempt uses {@link synthesizeHandoffTranslationOptions} (public Libre default, etc.). */
    let synthHandoffOptions = false;
    let lastIdentityStreakGuard: IdentityStreakGuard | undefined;
    let targetHadPartialWrite = false;
    while (pi < chain.length && attemptsRemaining > 0) {
      attemptsRemaining -= 1;
      const providerId = chain[pi]!;
      const translation = synthHandoffOptions
        ? synthesizeHandoffTranslationOptions({
            config: translateCfg,
            id: providerId,
            env: ctx.env,
          })
        : resolveTranslationProviderOptionsForId({
            config: translateCfg,
            id: providerId,
            env: ctx.env,
          });
      synthHandoffOptions = false;
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
      lastIdentityStreakGuard = streakGuard;

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
          dryRun: Boolean(opts.dryRun),
          force: forceTarget,
          provider,
          providerId: translation.provider,
          targetLang: target,
          sourceLang: 'en',
          translationCache,
          sourceMap,
          tickProgress: host.buildTickProgressRelay({
            tick: (i, total, p, tickOpts) => session.progress.tick(i, total, p, tickOpts),
            target,
            translationMeta: providerMeta,
          }),
          onTranslatedLeaf: async (sourceText, translatedText, keyPath) => {
            await streakGuard.onTranslated(sourceText, translatedText, keyPath);
          },
          localeLeafResolve: {
            configMode: opts.metadata ? ctx.config.localeLeaves?.mode : 'legacy_string',
            metadataFlag: opts.metadata === true,
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
          cacheHits: aggTranslateStats.cacheHits + translateResult.translateStats.cacheHits,
        };
        providerAttempts?.push({ providerId, outcome: 'success' });
        winnerProviderId = providerId;
        targetStreakIssues = streakGuard.flushIssues();
        lastIdentityStreakGuard = undefined;
        session.finish();

        {
          const wallMs = Date.now() - targetStarted;
          const s = translateResult.translateStats;
          emitGenerateMessage(host, 'info', formatGenerateTranslateProgress(target, wallMs, s));
          emitGenerateMessage(
            host,
            'info',
            `provider (${target}): id=${translation.provider} · workersRequested=${String(opts.workers ?? maxParallelTranslates)} · workersUsed=${String(maxParallelTranslates)} · maxConcurrency=${String(providerProfile.maxConcurrency)} · rpm=${String(rateLimit?.rpm ?? providerProfile.rpm)} · rps=${String(rateLimit?.rps ?? providerProfile.rps)} · intervalMs=${String(rateLimit?.intervalMs ?? providerProfile.intervalMs)}`,
          );
          const translatedLeaves = Math.max(
            0,
            sourceLeaves.length -
              translateResult.preserveCount -
              translateResult.paritySkip -
              translateResult.emptySourceLeafCount,
          );
          emitGenerateMessage(
            host,
            'info',
            `leaves (${target}): translated=${String(translatedLeaves)} · needsReview=${String(translateResult.markedForReview)}`,
          );
        }
        break;
      } catch (e: unknown) {
        const interrupted = e instanceof TranslateRunInterruptedError ? e : undefined;
        const rootCause = interrupted !== undefined ? interrupted.cause : e;
        const outcome = classifyProviderFailureOutcome(rootCause);
        const translateFailureOutcome = classifyTranslateFailure(rootCause);
        providerAttempts?.push({
          providerId,
          outcome,
          translateFailureOutcome,
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
        if (interrupted !== undefined) {
          working = interrupted.partialLocaleJson;
          aggTranslateStats = {
            requestAttempts: aggTranslateStats.requestAttempts + interrupted.translateStats.requestAttempts,
            retriesMade: aggTranslateStats.retriesMade + interrupted.translateStats.retriesMade,
            successfulLeaves: aggTranslateStats.successfulLeaves + interrupted.translateStats.successfulLeaves,
            failedRequests: aggTranslateStats.failedRequests + interrupted.translateStats.failedRequests,
            cacheHits: aggTranslateStats.cacheHits + interrupted.translateStats.cacheHits,
          };
        }

        const action = resolveProviderActionFor({
          outcome: translateFailureOutcome,
          policy: effectivePolicy,
          health,
          providerId,
          escalationThreshold,
        });
        const hasNext = pi < chain.length - 1;
        let verb: TranslatePolicyVerb = action.verb;

        const routing = effectivePolicy.routing ?? 'single';
        const handoffMode = effectivePolicy.handoff ?? 'auto';
        const handoffTty = host.canAskInteractive() && !host.shouldSkipInteractivePrompts();

        if (verb === 'prompt') {
          if (
            shouldWarnAndAbortHandoffOnNonTty({
              routing,
              handoff: handoffMode,
              isTty: handoffTty,
            })
          ) {
            emitGenerateMessage(
              host,
              'warn',
              `generate (${target}): handoff mode is "on" but this run is non-interactive; aborting instead of opening a provider picker.`,
            );
            verb = 'abort';
          } else if (
            shouldOfferHandoffInteractivePrompt({
              routing,
              handoff: handoffMode,
              isTty: handoffTty,
            })
          ) {
            const { eligibleRows, ineligibleReasons } = buildHandoffCatalogEligible(
              providerId,
              ctx.env,
              translateCfg,
            );
            if (eligibleRows.length === 0) {
              session.fail();
              const detail = Object.values(ineligibleReasons).filter(Boolean).join('; ');
              throw new I18nPruneError(
                `No eligible translation backend for handoff after "${providerId}" failed.${detail ? ` Filtered: ${detail}.` : ''}`,
                'USAGE',
                {
                  issueCode: ISSUE_TRANSLATE_HANDOFF_NO_ELIGIBLE_PROVIDER,
                  cause: rootCause,
                },
              );
            }
            session.progress.pauseClock?.({ clearBar: false });
            try {
              const defaultPick = eligibleRows[0]!.id;
              const offer: HandoffOffer = {
                target,
                failedProviderId: providerId,
                failureReason: outcome === 'success' ? 'non_retryable_error' : outcome,
                translateFailureOutcome,
                remainingProviderIds: chain.slice(pi + 1),
                eligibleHandoffRows: eligibleRows,
                partialStats: aggTranslateStats,
              };
              const rawPick =
                hooks?.onHandoffPick !== undefined ? await hooks.onHandoffPick(offer) : defaultPick;
              const pick = rawPick ?? defaultPick;
              const allowed = new Set(eligibleRows.map((r) => r.id));
              if (!allowed.has(pick)) {
                throw new I18nPruneError(
                  `runGenerate: onHandoffPick returned "${String(pick)}" which is not in eligibleHandoffRows (${eligibleRows.map((r) => r.id).join(', ')}).`,
                  'USAGE',
                );
              }
              prioritizeProviderAfter(chain, pi, pick);
              synthHandoffOptions = true;
            } finally {
              session.fail();
            }
            pi += 1;
            continue;
          } else {
            verb = hasNext ? 'fallback' : 'abort';
          }
        }

        if (verb === 'flag') verb = 'abort';

        session.fail();

        if (verb === 'abort' || (verb === 'fallback' && !hasNext) || attemptsRemaining <= 0) {
          break;
        }

        if (verb === 'fallback') {
          host.beforeProviderFallbackWarn?.();
          {
            const nextProvider = chain[pi + 1]!;
            const escalationHint =
              action.escalatedFrom !== undefined ? ` (${action.reason})` : '';
            const partialHint =
              interrupted !== undefined
                ? ` Partial progress kept (${String(interrupted.translateStats.successfulLeaves)} leaf translation(s) succeeded before interrupt); next provider fills the rest without restarting.`
                : '';
            emitGenerateMessage(
              host,
              'warn',
              `provider "${providerId}" failed (${translateFailureOutcome}); falling back to "${nextProvider}"${escalationHint}.${partialHint}`,
            );
          }
          pi += 1;
          continue;
        }

        emitGenerateMessage(
          host,
          'warn',
          `provider "${providerId}" failed (${translateFailureOutcome}); ${verb} per policy (attempts left: ${String(attemptsRemaining)}).`,
        );
      }
    }

    if (!translateResult) {
      if (lastIdentityStreakGuard !== undefined) {
        targetStreakIssues.push(...lastIdentityStreakGuard.flushIssues());
        lastIdentityStreakGuard = undefined;
      }

      const reason: IncompleteRunReason = isRetryableProviderFailure(lastErr)
        ? 'provider_chain_exhausted'
        : 'partial_after_non_retryable';
      const lastError = summarizeLastError(lastErr);
      const info: IncompleteRunInfo = {
        target,
        reason,
        partial: aggTranslateStats,
        successfulLeaves: aggTranslateStats.successfulLeaves,
        failedLeaves: Math.max(0, sourceLeaves.length - aggTranslateStats.successfulLeaves),
        providerAttempts: (providerAttempts ?? []).slice(),
        remainingProviderIds: chain.slice(pi + 1),
        ...(lastError !== undefined ? { lastError } : {}),
      };

      const incompleteVerb = effectivePolicy.onIncompleteRun;
      let decision: IncompleteRunDecision;
      if (incompleteVerb === 'discard') {
        decision = { action: 'abort_no_write' };
      } else if (incompleteVerb === 'write') {
        decision = { action: 'write_partial' };
      } else {
        decision = (await hooks?.onIncomplete?.(info)) ?? { action: 'write_partial' };
      }

      switch (decision.action) {
        case 'abort_no_write':
          throw lastErr instanceof Error
            ? lastErr
            : new Error(String(lastErr ?? 'generate: provider fallback exhausted without a result'));
        case 'retry_provider':
          throw new I18nPruneError(
            'runGenerate: onIncomplete returned "retry_provider" but that path is not yet implemented.',
            'USAGE',
          );
        case 'write_partial': {
          const finalized = finalizePartialTranslatedLocaleForGenerate({
            sourceLeaves,
            working,
            sourceMap,
            localeLeafResolve: {
              configMode: opts.metadata ? ctx.config.localeLeaves?.mode : 'legacy_string',
              metadataFlag: opts.metadata === true,
              stripMetadataFlag: false,
            },
            translateStats: aggTranslateStats,
          });
          translateResult = {
            ...finalized,
            translateStats: { ...aggTranslateStats },
          };
          working = translateResult.next;
          preserveCount = translateResult.preserveCount;
          paritySkip = translateResult.paritySkip;
          targetHadPartialWrite = true;
          emitGenerateMessage(
            host,
            'info',
            `generate (${target}): partial — ${String(aggTranslateStats.successfulLeaves)}/${String(sourceLeaves.length)} translated (${String(translateResult.markedForReview)} marked for review). Run \`i18nprune generate --target ${target} --resume\` to finish.`,
          );
          break;
        }
      }
    }

    if (translateResult === undefined) {
      throw new I18nPruneError('runGenerate: invariant violated (no translate result after provider loop)', 'USAGE');
    }

    streakIssues.push(...targetStreakIssues);
    const emptyIssueList = translateResult.issues ?? [];
    for (const issue of emptyIssueList) {
      streakIssues.push(issue);
      if (issue.code === ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES) {
        emitGenerateMessage(host, 'notice', issue.message);
      }
    }

    const modeDecision = translateResult.modeDecision;
    const normalizedReport = translateResult.report;

    if (!opts.dryRun) {
      emitProgress({ type: 'run.progress.generate', phase: 'write_files', target, label: targetPath });
      writeLocaleJsonFromContextSync(ctx, targetPath, working);
    }

    host.printPreserveParityReport(preserveCount, paritySkip);
    host.printFinalizeSummary({
      target,
      englishName,
      nativeName,
      direction,
      targetPath,
      leafCount: sourceLeaves.length,
      dryRun: opts.dryRun,
    });

    totalLeavesProcessed += sourceLeaves.length;
    targetResults.push({
      target,
      status: opts.dryRun ? 'dry_run' : 'written',
      sourceLeafCount: sourceLeaves.length,
      preserveCount,
      paritySkip,
      progress: {
        sourceLeafCount: sourceLeaves.length,
        processedLeafCount: sourceLeaves.length,
        translatedLeafCount: Math.max(
          0,
          sourceLeaves.length - preserveCount - paritySkip - translateResult.emptySourceLeafCount,
        ),
        preserveCount,
        paritySkipCount: paritySkip,
        forced: forceTarget,
        durationMs: Date.now() - targetStarted,
        requestAttempts: translateResult.translateStats.requestAttempts,
        requestRetries: translateResult.translateStats.retriesMade,
        requestSuccesses: translateResult.translateStats.successfulLeaves,
        requestFailures: translateResult.translateStats.failedRequests,
      },
      providerAttempts,
      winnerProviderId,
      fallbackCount: Math.max(0, (providerAttempts?.length ?? 0) - 1),
      markedForReview: translateResult.markedForReview,
      paths: { localeJson: targetPath },
      localeMetadata: normalizedReport,
      ...(targetHadPartialWrite ? { partial: true } : {}),
    });

    if (targetHadPartialWrite) {
      generatePayloadPartial = true;
      generatePayloadPartialMarkedSum += translateResult.markedForReview;
    }

    {
      const route = (providerAttempts ?? []).map((a) => a.providerId).join(' -> ');
      emitGenerateMessage(
        host,
        'info',
        `provider route (${target}): ${route} (winner: ${winnerProviderId ?? 'none'}, fallbacks: ${String(Math.max(0, (providerAttempts?.length ?? 0) - 1))})`,
      );
    }
    if (modeDecision.mode === 'structured') {
      emitGenerateMessage(
        host,
        'info',
        `metadata for ${target}: structured ${String(normalizedReport.structuredLeavesWritten)}, repaired ${String(normalizedReport.repairedCorruptLeaves)}. Use "sync --strip-metadata" to remove metadata fields later.`,
      );
    }
    } finally {
      flushTranslateCacheL2(targetL2);
    }
  }

  emitProgress({ type: 'run.progress.generate', phase: 'done' });

  const payload: GenerateJsonPayload = {
    kind: 'generate',
    providerId: translationMeta.providerId,
    dryRun: Boolean(opts.dryRun),
    force: Boolean(opts.force),
    targets: targets.slice(),
    dynamicKeySites: opts.dynamicKeySites,
    leavesProcessed: totalLeavesProcessed,
    targetResults,
    ...(generatePayloadPartial
      ? {
          partial: true,
          resumeHint: 'generate --resume',
          markedForReview: generatePayloadPartialMarkedSum,
        }
      : {}),
  };

  return { payload, issues: streakIssues };
}
