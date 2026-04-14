import path from 'node:path';
import { scanProjectDynamicKeySites } from '@/core/extractor/dynamic/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { collectStringLeaves, deepClone } from '@/core/json/index.js';
import {
  buildTranslatedLocaleFromSourceLeaves,
  normalizeGeneratePromptLang,
  targetLocaleCoversAllSourcePaths,
} from '@/core/generate/index.js';
import { createSessionProgress } from '@/core/progress/session.js';
import { createIdentityStreakGuard, IdentityAbortError } from '@/core/translator/identity.js';
import { createTranslator } from '@/core/translator/init.js';
import {
  promptLanguageCodeOnly,
  promptMetaLocaleDetails,
  promptFullRetranslate,
  printGenerateSessionBanner,
} from '@/commands/generate/prompts.js';
import { canAsk } from '@/core/ask/index.js';
import {
  printGenerateFinalizeSummary,
  printPreserveParityReport,
} from '@/commands/generate/summary/index.js';
import type { GenerateOptions } from '@/types/command/generate/index.js';
import type { GenerateJsonPayload, GenerateTargetJsonRow } from '@/types/command/generate/json.js';
import type { Context } from '@/types/core/context/index.js';
import type { Issue } from '@/types/core/json/envelope.js';
import { readJsonFile, writeJsonFile, fileExists } from '@/utils/fs/index.js';
import { resolveFromCwd } from '@/utils/paths/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo, canPrintPrimary } from '@/utils/logger/policy.js';
import { getLanguageByCode, validateTargetLanguageCode } from '@/core/languages/index.js';
import { languageOftenRtl } from '@/core/languages/rtlHint.js';
import { assertNotSourceTargetLocale } from '@/core/locales/source.js';
import { parseLocaleCodesList, pickTargetSelector } from '@/utils/cli/args.js';
import {
  issuesFromDiscoveryWarnings,
  issuesFromDynamicScanCount,
  mergeIssues,
} from '@/core/result/cliEnvelopeIssues.js';

/**
 * Core generate workflow (writes locale files unless `dryRun`). Used by the CLI and {@link runGenerate}.
 */
export async function executeGenerate(
  ctx: Context,
  merged: GenerateOptions,
): Promise<{ payload: GenerateJsonPayload; issues: Issue[] }> {
  const dynamicSites = scanProjectDynamicKeySites(ctx);
  if (dynamicSites.length > 0 && canPrintInfo(ctx.run)) {
    logger.info(
      `generate: ${String(dynamicSites.length)} non-literal translation call site(s) — generation follows source JSON paths only; computed keys are not enumerated here.`,
      ctx.run,
    );
  }
  const sourcePath = merged.source ? resolveFromCwd(merged.source) : ctx.paths.sourceLocale;
  const raw = readJsonFile(sourcePath);
  const sourceLeaves = collectStringLeaves(raw);

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
  const provider = createTranslator();
  let totalLeavesProcessed = 0;
  const targetResults: GenerateTargetJsonRow[] = [];
  const streakIssues: Issue[] = [];

  for (const target of targets) {
    const targetStarted = Date.now();
    assertNotSourceTargetLocale('generate', target, ctx.paths.sourceLocale, ctx);
    validateTargetLanguageCode(target);
    const catalog = getLanguageByCode(target);
    let englishName = merged.englishName ?? catalog?.english ?? target;
    let nativeName = merged.nativeName ?? catalog?.native ?? target;
    let direction: 'ltr' | 'rtl' = merged.direction === 'rtl' ? 'rtl' : 'ltr';
    if (!merged.noMeta && canAsk(ctx.run) && !merged.englishName && !merged.nativeName) {
      const meta = await promptMetaLocaleDetails({ englishName, nativeName, direction }, ctx.run);
      englishName = meta.englishName;
      nativeName = meta.nativeName;
      direction = meta.direction;
    }
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
    const metaPath = merged.noMeta ? null : path.join(ctx.paths.localesDir, `${target}.meta.json`);
    const existingRaw = fileExists(targetPath) ? readJsonFile(targetPath) : null;
    if (existingRaw && targetLocaleCoversAllSourcePaths(raw, existingRaw) && !merged.force && !merged.dryRun) {
      if (canAsk(ctx.run)) {
        const ok = await promptFullRetranslate();
        if (!ok) {
          logger.info(`generate skipped for ${target} (target already complete).`, ctx.run);
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
    const session = createSessionProgress({ quiet: ctx.run.quiet, json: ctx.run.json });
    const streakGuard = createIdentityStreakGuard(ctx, 'generate', target);
    printGenerateSessionBanner(ctx.run);
    let working: unknown = deepClone(raw);
    let preserveCount = 0;
    let paritySkip = 0;
    try {
      const built = await buildTranslatedLocaleFromSourceLeaves({
        sourceLeaves,
        working,
        existingRaw,
        preserve: ctx.config.policies?.preserve,
        parity: ctx.config.policies?.parity,
        dryRun: Boolean(merged.dryRun),
        force: Boolean(merged.force),
        provider,
        targetLang: target,
        tickProgress: (i, total, p) => session.progress.tick(i, total, p),
        onTranslatedLeaf: async (sourceText, translatedText, keyPath) => {
          await streakGuard.onTranslated(sourceText, translatedText, keyPath);
        },
      });
      working = built.working;
      preserveCount = built.preserveCount;
      paritySkip = built.paritySkip;
      session.finish();
    } catch (e) {
      session.fail();
      if (e instanceof IdentityAbortError) {
        const issues = [
          ...streakGuard.flushIssues(),
          {
            severity: 'error',
            code: 'i18nprune.translate.identity_streak_abort',
            message: e.message,
            docPath: 'json/issue-codes',
          },
        ] as Issue[];
        (e as Error & { issues?: Issue[] }).issues = issues;
      }
      throw e;
    }
    streakIssues.push(...streakGuard.flushIssues());
    if (!merged.dryRun) {
      writeJsonFile(targetPath, working);
      if (metaPath) {
        writeJsonFile(metaPath, { lang: target, englishName, nativeName, direction });
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
          showMeta: !merged.noMeta,
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
        translatedLeafCount: Math.max(0, sourceLeaves.length - preserveCount - paritySkip),
        preserveCount,
        paritySkipCount: paritySkip,
        forced: Boolean(merged.force),
        durationMs: Date.now() - targetStarted,
      },
      paths: { localeJson: targetPath, metaJson: metaPath },
    });
  }

  const issues = mergeIssues(
    issuesFromDiscoveryWarnings(ctx.meta.warnings),
    issuesFromDynamicScanCount(dynamicSites.length),
    streakIssues,
  );

  const payload: GenerateJsonPayload = {
    kind: 'generate',
    dryRun: Boolean(merged.dryRun),
    force: Boolean(merged.force),
    targets: targets.slice(),
    dynamicKeySites: dynamicSites.length,
    leavesProcessed: totalLeavesProcessed,
    targetResults,
  };

  return { payload, issues };
}
