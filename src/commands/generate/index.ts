import path from 'node:path';
import { resolveContext } from '@/core/context/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import {
  collectStringLeaves,
  deepClone,
  setAtPath,
  getAtPath,
} from '@/core/json/index.js';
import { isPreservePath, isParityExcluded } from '@/core/parity/index.js';
import { createSessionProgress } from '@/core/progress/session.js';
import { printCommandSummary } from '@/core/output/index.js';
import { createTranslator } from '@/core/translator/init.js';
import { translateLeaf } from '@/core/translator/index.js';
import {
  canPromptGenerate,
  promptLanguageCodeOnly,
  promptMetaLocaleDetails,
  promptFullRetranslate,
  printGenerateSessionBanner,
} from '@/commands/generate/prompts.js';
import { mergeGenerateOptionsFromEnv } from '@/commands/generate/env.js';
import {
  printGenerateFinalizeSummary,
  printPreserveParityReport,
} from '@/commands/generate/summary/index.js';
import type { GenerateOptions } from '@/types/command/generate/index.js';
import { readJsonFile, writeJsonFile, fileExists } from '@/utils/fs/index.js';
import { resolveFromCwd } from '@/utils/paths/index.js';
import { logger } from '@/utils/logger/index.js';
import { canPrintInfo, canPrintPrimary } from '@/utils/logger/policy.js';
import { getLanguageByCode, validateTargetLanguageCode } from '@/core/languages/index.js';
import { assertNotSourceTargetLocale } from '@/core/locales/source.js';

export type { GenerateOptions } from '@/types/command/generate/index.js';

function targetCoversAllSourcePaths(sourceRaw: unknown, targetRaw: unknown): boolean {
  const sLeaves = collectStringLeaves(sourceRaw);
  const tLeaves = collectStringLeaves(targetRaw);
  const targetSet = new Set(tLeaves.map((l) => l.path));
  return sLeaves.every((l) => targetSet.has(l.path));
}

export async function generate(opts: GenerateOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  const merged = mergeGenerateOptionsFromEnv(opts);

  for (const w of ctx.meta.warnings) {
    logger.detail(w, ctx.run);
  }

  const sourcePath = merged.source ? resolveFromCwd(merged.source) : ctx.paths.sourceLocale;
  const raw = readJsonFile(sourcePath);
  const sourceLeaves = collectStringLeaves(raw);

  let lang = merged.lang?.trim();
  if (!lang) {
    if (!canPromptGenerate(ctx.run)) {
      throw new I18nPruneError('generate requires --lang (non-interactive)', 'USAGE');
    }
    lang = (await promptLanguageCodeOnly(ctx.run)).trim();
  }
  assertNotSourceTargetLocale('generate', lang, ctx.paths.sourceLocale, ctx);
  validateTargetLanguageCode(lang);

  const catalog = getLanguageByCode(lang);
  let englishName = merged.englishName ?? catalog?.english ?? lang;
  let nativeName = merged.nativeName ?? catalog?.native ?? lang;
  let direction: 'ltr' | 'rtl' = merged.direction === 'rtl' ? 'rtl' : 'ltr';

  if (!merged.noMeta && canPromptGenerate(ctx.run) && !merged.englishName && !merged.nativeName) {
    const meta = await promptMetaLocaleDetails(
      { englishName, nativeName, direction },
      ctx.run,
    );
    englishName = meta.englishName;
    nativeName = meta.nativeName;
    direction = meta.direction;
  }

  const targetPath = path.join(ctx.paths.localesDir, `${lang}.json`);
  const metaPath = merged.noMeta ? null : path.join(ctx.paths.localesDir, `${lang}.meta.json`);

  const existingRaw = fileExists(targetPath) ? readJsonFile(targetPath) : null;
  if (
    existingRaw &&
    targetCoversAllSourcePaths(raw, existingRaw) &&
    !merged.force &&
    !merged.dryRun
  ) {
    if (canPromptGenerate(ctx.run)) {
      const ok = await promptFullRetranslate();
      if (!ok) {
        logger.info('generate skipped (target already complete).', ctx.run);
        printCommandSummary({ command: 'generate', ok: true, durationMs: Date.now() - started }, ctx);
        return;
      }
    }
  }

  const provider = createTranslator();
  const session = createSessionProgress({ quiet: ctx.run.quiet, json: ctx.run.json });
  printGenerateSessionBanner(ctx.run);

  let working: unknown = deepClone(raw);
  let preserveCount = 0;
  let paritySkip = 0;
  const total = sourceLeaves.length;
  let i = 0;

  try {
    for (const leaf of sourceLeaves) {
      i += 1;
      if (isPreservePath(leaf.path, ctx.config.policies?.preserve)) {
        working = setAtPath(working, leaf.path, leaf.value);
        preserveCount += 1;
        session.progress.tick(i, total, leaf.path);
        continue;
      }
      if (isParityExcluded(leaf.path, leaf.value, ctx.config.policies?.parity)) {
        const cur =
          existingRaw && typeof existingRaw === 'object'
            ? getAtPath(existingRaw, leaf.path)
            : undefined;
        const v = typeof cur === 'string' ? cur : leaf.value;
        working = setAtPath(working, leaf.path, v);
        paritySkip += 1;
        session.progress.tick(i, total, leaf.path);
        continue;
      }

      let nextVal: string;
      if (merged.dryRun) {
        nextVal = leaf.value;
      } else if (
        existingRaw &&
        !merged.force &&
        typeof existingRaw === 'object'
      ) {
        const cur = getAtPath(existingRaw, leaf.path);
        if (typeof cur === 'string' && cur !== leaf.value) {
          nextVal = cur;
          session.progress.tick(i, total, leaf.path);
          working = setAtPath(working, leaf.path, nextVal);
          continue;
        }
        nextVal = await translateLeaf(provider, leaf.value, 'en', lang);
      } else {
        nextVal = await translateLeaf(provider, leaf.value, 'en', lang);
      }
      working = setAtPath(working, leaf.path, nextVal);
      session.progress.tick(i, total, leaf.path);
    }

    session.finish();
  } catch (e) {
    session.fail();
    throw e;
  }

  if (!merged.dryRun) {
    writeJsonFile(targetPath, working);
    if (metaPath) {
      writeJsonFile(metaPath, {
        lang,
        englishName,
        nativeName,
        direction,
      });
    }
  }

  printPreserveParityReport(preserveCount, paritySkip, ctx.run);
  if (canPrintPrimary(ctx.run) || (merged.dryRun && canPrintInfo(ctx.run))) {
    printGenerateFinalizeSummary(
      {
        lang,
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

  printCommandSummary(
    {
      command: 'generate',
      ok: true,
      durationMs: Date.now() - started,
      counts: { leaves: sourceLeaves.length },
    },
    ctx,
  );
}
