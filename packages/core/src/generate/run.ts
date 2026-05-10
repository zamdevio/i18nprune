/**
 * Public **`runGenerate`** — project-scoped generate: read source locale, walk targets, run per-provider
 * translate+normalize, write files. Host supplies TTY / prompts / progress via {@link GenerateHostHooks}.
 */

import { buildLanguageCatalog, generatedLanguageCatalog, getLanguageByCodeFromCatalog } from '../shared/languages/catalog/index.js';
import { languageOftenRtl } from '../shared/languages/rtlHint.js';
import { collectStringLeaves, deepClone } from '../shared/json/index.js';
import { targetLocaleCoversAllSourcePaths } from '../shared/json/targetCoverage.js';
import { readJsonFromRuntimeFsSync } from '../runtime/helpers/sync/readJson.js';
import { existsRuntimeFsSync } from '../runtime/helpers/sync/fs.js';
import { assertGenerateTargetCodes } from '../locales/generateTargets.js';
import { issueCodeRepoDocPathForIssueCode } from '../shared/docs/issueAnchors.js';
import { ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES, ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT } from '../shared/constants/issueCodes.js';
import { I18nPruneError } from '../shared/errors/index.js';
import { translateAndNormalizeGenerateLocale } from './translateAndNormalize.js';
import { TranslateRunInterruptedError } from './translateRunInterruptedError.js';
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
import { IdentityAbortError } from '../translator/identity/error.js';
import { writeRuntimeJsonPretty } from './io/writeRuntimeJson.js';
import {
  generateCanPrintInfo,
  generateCanPrintPrimary,
  generateCanPrintWarn,
} from './runLogGates.js';
import type { Issue } from '../types/json/envelope/index.js';
import type {
  CoreContext,
  GenerateHostHooks,
  GenerateJsonPayload,
  GenerateRunOptions,
  GenerateRunResult,
  GenerateTargetJsonRow,
} from '../types/generate/generateRun.js';

const LANG_CATALOG = buildLanguageCatalog(generatedLanguageCatalog);

function resolveGenerateSourcePath(ctx: CoreContext, sourceOverride: string | undefined): string {
  if (sourceOverride === undefined || sourceOverride === '') return ctx.paths.sourceLocale;
  const cwd = ctx.adapters.system.cwd();
  return ctx.adapters.path.isAbsolute(sourceOverride)
    ? sourceOverride
    : ctx.adapters.path.resolve(cwd, sourceOverride);
}

function shouldSkipLocaleMetaSidecar(opts: { noLocaleMeta?: boolean }, config: { noLocaleMeta?: boolean }): boolean {
  return opts.noLocaleMeta === true || config.noLocaleMeta === true;
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

export async function runGenerate(
  ctx: CoreContext,
  opts: GenerateRunOptions,
  host: GenerateHostHooks,
): Promise<GenerateRunResult> {
  const run = ctx.run;
  const emitProgress = host.emitProgress;

  const sourcePath = resolveGenerateSourcePath(ctx, opts.source);
  let raw: unknown;
  if (opts.preloadedRaw !== undefined) {
    raw = opts.preloadedRaw;
  } else {
    emitProgress({ type: 'run.progress.generate', phase: 'read_source', label: sourcePath });
    raw = readJsonFromRuntimeFsSync(sourcePath, ctx.adapters.fs);
  }
  const sourceLeaves = collectStringLeaves(raw);
  const sourceMap = new Map(sourceLeaves.map((leaf) => [leaf.path, leaf.value]));

  const targets = [...opts.targets];
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

  const skipLocaleMetaSidecar = shouldSkipLocaleMetaSidecar(opts, ctx.config);
  const translateCfg = ctx.config.translate;
  if (!translateCfg) {
    throw new I18nPruneError('config.translate is required for generate', 'USAGE');
  }
  const providerOrder = resolveTranslationProviderOrder({
    config: translateCfg,
    pin: opts.provider,
    env: ctx.env,
  });
  const primaryTranslation = resolveTranslationProviderOptions({
    config: translateCfg,
    pin: opts.provider,
    env: ctx.env,
  });
  assertTranslationProviderCredentialsReady(primaryTranslation);
  const translationMeta = translationRunMeta(primaryTranslation);

  let totalLeavesProcessed = 0;
  const targetResults: GenerateTargetJsonRow[] = [];
  const streakIssues: Issue[] = [];

  for (const target of targets) {
    emitProgress({ type: 'run.progress.generate', phase: 'build_target', target });
    const targetStarted = Date.now();
    const catalog = getLanguageByCodeFromCatalog(LANG_CATALOG, target);
    let englishName = opts.englishName ?? catalog?.english ?? target;
    let nativeName = opts.nativeName ?? catalog?.native ?? target;
    let direction: 'ltr' | 'rtl' = resolveGenerateDirectionDefault({
      explicitDirection: opts.direction,
      targetCode: target,
      catalogDirection: catalog?.direction,
    });
    if (generateCanPrintInfo(run)) {
      const oftenRtl = languageOftenRtl(target);
      if (oftenRtl && direction === 'ltr') {
        host.log.warn?.(
          `generate: "${target}" is often RTL in UIs — direction is ltr. Pass --direction rtl if the locale should be mirrored.`,
        );
      } else if (!oftenRtl && direction === 'rtl') {
        host.log.warn?.(
          `generate: "${target}" is usually LTR — confirm --direction rtl is intentional for your app.`,
        );
      }
    }

    const targetPath = ctx.adapters.path.join(ctx.paths.localesDir, `${target}.json`);
    const metaPath = skipLocaleMetaSidecar ? null : ctx.adapters.path.join(ctx.paths.localesDir, `${target}.meta.json`);

    if (metaPath !== null && existsRuntimeFsSync(metaPath, ctx.adapters.fs)) {
      const prev = readJsonFromRuntimeFsSync(metaPath, ctx.adapters.fs);
      if (prev && typeof prev === 'object') {
        const p = prev as { englishName?: unknown; nativeName?: unknown; direction?: unknown };
        if (typeof p.englishName === 'string' && p.englishName.trim() !== '') englishName = p.englishName;
        if (typeof p.nativeName === 'string' && p.nativeName.trim() !== '') nativeName = p.nativeName;
        if (p.direction === 'ltr' || p.direction === 'rtl') direction = p.direction;
      }
    }

    if (
      !host.shouldSkipInteractivePrompts() &&
      host.canAskInteractive() &&
      !opts.englishName &&
      !opts.nativeName
    ) {
      const meta = await host.promptMetaLocaleDetails({ englishName, nativeName, direction });
      englishName = meta.englishName;
      nativeName = meta.nativeName;
      direction = meta.direction;
    }

    const existingRaw = existsRuntimeFsSync(targetPath, ctx.adapters.fs)
      ? readJsonFromRuntimeFsSync(targetPath, ctx.adapters.fs)
      : null;

    if (existingRaw && targetLocaleCoversAllSourcePaths(raw, existingRaw) && !opts.force && !opts.dryRun) {
      if (!host.shouldSkipInteractivePrompts() && host.canAskInteractive()) {
        const ok = await host.promptFullRetranslate();
        if (!ok) {
          host.log.info?.(`skipped for ${target} (target already complete).`);
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
      }
    }

    host.printSessionBanner();
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
      if (limitSuggestion && generateCanPrintInfo(run)) host.log.warn?.(limitSuggestion);

      const session = host.createSession();
      const streakGuard = host.createIdentityStreakGuard(target, {
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
          dryRun: Boolean(opts.dryRun),
          force: Boolean(opts.force),
          provider,
          providerId: translation.provider,
          targetLang: target,
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
        };
        providerAttempts?.push({ providerId, outcome: 'success' });
        winnerProviderId = providerId;
        targetStreakIssues = streakGuard.flushIssues();
        session.finish();

        if (generateCanPrintInfo(run)) {
          const wallMs = Date.now() - targetStarted;
          const s = translateResult.translateStats;
          const avgRequestMs = s.requestAttempts > 0 ? Math.round(wallMs / s.requestAttempts) : 0;
          host.log.info?.(
            `progress (${target}): wall=${String(wallMs)}ms · requests=${String(s.requestAttempts)} · success=${String(s.successfulLeaves)} · failed=${String(s.failedRequests)} · retries=${String(s.retriesMade)} · avgRequest=${String(avgRequestMs)}ms`,
          );
          host.log.info?.(
            `provider (${target}): id=${translation.provider} · workersRequested=${String(opts.workers ?? maxParallelTranslates)} · workersUsed=${String(maxParallelTranslates)} · maxConcurrency=${String(providerProfile.maxConcurrency)} · rpm=${String(rateLimit?.rpm ?? providerProfile.rpm)} · rps=${String(rateLimit?.rps ?? providerProfile.rps)} · intervalMs=${String(rateLimit?.intervalMs ?? providerProfile.intervalMs)}`,
          );
          const translatedLeaves = Math.max(
            0,
            sourceLeaves.length -
              translateResult.preserveCount -
              translateResult.paritySkip -
              translateResult.emptySourceLeafCount,
          );
          host.log.info?.(
            `leaves (${target}): translated=${String(translatedLeaves)} · needsReview=${String(translateResult.markedForReview)}`,
          );
        }
        break;
      } catch (e: unknown) {
        session.fail();
        const interrupted = e instanceof TranslateRunInterruptedError ? e : undefined;
        const rootCause = interrupted !== undefined ? interrupted.cause : e;
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
        if (interrupted !== undefined) {
          working = interrupted.partialLocaleJson;
          aggTranslateStats = {
            requestAttempts: aggTranslateStats.requestAttempts + interrupted.translateStats.requestAttempts,
            retriesMade: aggTranslateStats.retriesMade + interrupted.translateStats.retriesMade,
            successfulLeaves: aggTranslateStats.successfulLeaves + interrupted.translateStats.successfulLeaves,
            failedRequests: aggTranslateStats.failedRequests + interrupted.translateStats.failedRequests,
          };
        }
        const hasNext = pi < providerOrder.length - 1;
        if (!hasNext || !isRetryableProviderFailure(rootCause)) {
          throw rootCause instanceof Error ? rootCause : new Error(String(rootCause));
        }
        if (generateCanPrintWarn(run)) {
          host.beforeProviderFallbackWarn?.();
          const nextProvider = providerOrder[pi + 1]!;
          const partialHint =
            interrupted !== undefined
              ? ` Partial progress kept (${String(interrupted.translateStats.successfulLeaves)} leaf translation(s) succeeded before interrupt); next provider fills the rest without restarting.`
              : '';
          host.log.warn?.(
            `provider "${providerId}" failed with a retryable backend error; retrying target "${target}" with "${nextProvider}".${partialHint}`,
          );
        }
      }
    }

    if (!translateResult) throw (lastErr ?? new Error('generate: provider fallback exhausted without a result'));

    streakIssues.push(...targetStreakIssues);
    const emptyIssueList = translateResult.issues ?? [];
    for (const issue of emptyIssueList) {
      streakIssues.push(issue);
      if (issue.code === ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES && generateCanPrintInfo(run)) {
        host.log.warn?.(issue.message);
      }
    }

    const modeDecision = translateResult.modeDecision;
    const normalizedReport = translateResult.report;

    if (!opts.dryRun) {
      emitProgress({ type: 'run.progress.generate', phase: 'write_files', target, label: targetPath });
      writeRuntimeJsonPretty(targetPath, working, ctx.adapters);
      if (metaPath !== null) {
        emitProgress({ type: 'run.progress.generate', phase: 'write_files', target, label: metaPath });
        writeRuntimeJsonPretty(metaPath, { lang: target, englishName, nativeName, direction }, ctx.adapters);
      }
    }

    host.printPreserveParityReport(preserveCount, paritySkip);
    if (generateCanPrintPrimary(run) || (opts.dryRun && generateCanPrintInfo(run))) {
      host.printFinalizeSummary({
        target,
        englishName,
        nativeName,
        direction,
        targetPath,
        metaPath,
        leafCount: sourceLeaves.length,
        showMeta: true,
        dryRun: opts.dryRun,
      });
    }

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
        forced: Boolean(opts.force),
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
      paths: { localeJson: targetPath, metaJson: metaPath },
      localeMetadata: normalizedReport,
    });

    if (generateCanPrintInfo(run)) {
      const route = (providerAttempts ?? []).map((a) => a.providerId).join(' -> ');
      host.log.info?.(
        `provider route (${target}): ${route} (winner: ${winnerProviderId ?? 'none'}, fallbacks: ${String(Math.max(0, (providerAttempts?.length ?? 0) - 1))})`,
      );
    }
    if (modeDecision.mode === 'structured' && generateCanPrintInfo(run)) {
      host.log.info?.(
        `metadata for ${target}: structured ${String(normalizedReport.structuredLeavesWritten)}, repaired ${String(normalizedReport.repairedCorruptLeaves)}. Use "sync --strip-metadata" to remove metadata fields later.`,
      );
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
  };

  return { payload, issues: streakIssues };
}
