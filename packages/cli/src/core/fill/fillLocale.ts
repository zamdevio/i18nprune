import path from 'node:path';
import { collectStringLeaves, setAtPath } from '@/core/json/index.js';
import { createSessionProgress } from '@/core/progress/session.js';
import { createIdentityStreakGuard, IdentityAbortError } from '@/core/translator/identity.js';
import { readJsonFile, writeJsonFile, fileExists } from '@/utils/fs/index.js';
import { isParityExcluded } from '@/core/parity/index.js';
import { isPreservePath } from '@/core/preserve/index.js';
import { pathUnderAnyUncertainPrefix } from '@/core/reference/paths.js';
import { createTranslator } from '@/core/translator/init.js';
import { translateLeaf } from '@/core/translator/index.js';
import { printFillDryRunSummary, printFillTargetFinalizeSummary } from '@/core/fill/summary.js';
import { getLanguageByCode } from '@/core/languages/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import type { FillOptions } from '@/types/command/fill/index.js';
import type { Issue } from '@/types/core/json/envelope.js';
import type { TargetProgressSummary } from '@/types/core/progress/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { EffectiveReferenceConfig } from '@/types/config/reference.js';
import type { KeyReferenceContext } from '@/types/core/reference/context.js';

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
): Promise<{
  updated: number;
  targetPath: string;
  metaPath: string | null;
  progress: TargetProgressSummary;
  issues: Issue[];
}> {
  const started = Date.now();
  const catalog = getLanguageByCode(target);
  const targetPath = path.join(ctx.paths.localesDir, `${target}.json`);
  if (!fileExists(targetPath)) {
    throw new I18nPruneError(`fill: locale file missing: ${targetPath}`, 'USAGE');
  }
  const targetRaw = readJsonFile(targetPath);
  const tLeaves = collectStringLeaves(targetRaw);
  const metaPath = !opts.noMeta ? path.join(ctx.paths.localesDir, `${target}.meta.json`) : null;
  let metaDirection: 'ltr' | 'rtl' = 'ltr';
  if (metaPath && fileExists(metaPath)) {
    const prev = readJsonFile(metaPath);
    if (
      prev &&
      typeof prev === 'object' &&
      (prev as { direction?: string }).direction === 'rtl'
    ) {
      metaDirection = 'rtl';
    }
  }

  const provider = createTranslator();
  let changed = 0;
  let next: unknown = targetRaw;
  const streakGuard = createIdentityStreakGuard(ctx, 'fill', target);

  const session = createSessionProgress({ quiet: ctx.run.quiet, json: ctx.run.json });
  try {
    const total = tLeaves.length;
    for (let i = 0; i < tLeaves.length; i++) {
      const leaf = tLeaves[i]!;
      session.progress.tick(i + 1, total, leaf.path);
      const srcVal = sourceMap.get(leaf.path);
      if (srcVal === undefined) continue;
      if (eff.respectPreserve && isPreservePath(leaf.path, ctx.config.policies?.preserve)) continue;
      if (eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only') {
        if (pathUnderAnyUncertainPrefix(leaf.path, refCtx.uncertainPrefixes)) continue;
      }
      if (isParityExcluded(leaf.path, leaf.value, ctx.config.policies?.parity)) continue;
      if (leaf.value !== srcVal) continue;
      if (opts.dryRun) {
        changed += 1;
        continue;
      }
      const translated = await translateLeaf(provider, srcVal, 'en', target, {
        onTranslated: async (sourceText, translatedText) => {
          await streakGuard.onTranslated(sourceText, translatedText, leaf.path);
        },
      });
      next = setAtPath(next, leaf.path, translated);
      changed += 1;
    }
    session.finish();
  } catch (e) {
    session.fail();
    if (e instanceof IdentityAbortError) {
      const issues = [
        ...streakGuard.flushIssues(),
        {
          severity: 'error' as const,
          code: 'i18nprune.translate.identity_streak_abort',
          message: e.message,
          docPath: 'json/issue-codes',
        },
      ];
      (e as Error & { issues?: Issue[] }).issues = issues;
    }
    throw e;
  }

  if (!opts.dryRun && changed > 0) {
    writeJsonFile(targetPath, next);
  }
  if (!opts.dryRun && metaPath) {
    writeJsonFile(metaPath, {
      lang: target,
      englishName: catalog?.english ?? target,
      nativeName: catalog?.native ?? target,
      direction: metaDirection,
    });
  }

  if (opts.dryRun) {
    printFillDryRunSummary(
      {
        target,
        targetPath,
        metaPath,
        showMeta: !opts.noMeta,
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
        showMeta: !opts.noMeta,
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
        showMeta: !opts.noMeta,
      },
      ctx.run,
    );
  }

  return {
    updated: changed,
    targetPath,
    metaPath,
    issues: streakGuard.flushIssues(),
    progress: {
      sourceLeafCount: sourceMap.size,
      processedLeafCount: tLeaves.length,
      translatedLeafCount: changed,
      updatedLeafCount: changed,
      durationMs: Date.now() - started,
    },
  };
}
