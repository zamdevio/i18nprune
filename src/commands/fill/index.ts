import path from 'node:path';
import { resolveContext } from '@/core/context/index.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { collectStringLeaves, setAtPath } from '@/core/json/index.js';
import { createSessionProgress } from '@/core/progress/session.js';
import { readJsonFile, writeJsonFile, fileExists } from '@/utils/fs/index.js';
import { isParityExcluded } from '@/core/parity/index.js';
import { createTranslator } from '@/core/translator/init.js';
import { translateLeaf } from '@/core/translator/index.js';
import {
  canPromptGenerate,
  promptFillLanguageSelection,
  listOtherLocaleCodes,
} from '@/commands/generate/prompts.js';
import { printFillDryRunSummary } from '@/commands/fill/summary.js';
import { printCommandSummary } from '@/core/output/index.js';
import { getLanguageByCode, validateTargetLanguageCode, normalizeLanguageCode } from '@/core/languages/index.js';
import { assertNotSourceTargetLocale } from '@/core/locales/source.js';
import { finalizeReportFile, pushReportEntry } from '@/utils/report/index.js';
import { parseLocaleCodesList, isAllLangToken } from '@/utils/cli/args.js';
import type { FillOptions } from '@/types/command/fill/index.js';
import type { Context } from '@/types/core/context/index.js';

async function resolveFillLanguages(ctx: Context, opts: FillOptions): Promise<string[]> {
  const sourceBase = path.basename(ctx.paths.sourceLocale, '.json');
  const raw = opts.lang?.trim();
  if (!raw) {
    if (!canPromptGenerate(ctx.run)) {
      throw new I18nPruneError('fill requires --lang (non-interactive)', 'USAGE');
    }
    const picked = await promptFillLanguageSelection(ctx.paths.localesDir, sourceBase, ctx.run);
    if (isAllLangToken(picked)) {
      const codes = listOtherLocaleCodes(ctx.paths.localesDir, sourceBase);
      if (codes.length === 0) {
        throw new I18nPruneError('fill: no target locales to fill (besides source).', 'USAGE');
      }
      return codes.map((c) => normalizeLanguageCode(c));
    }
    const code = normalizeLanguageCode(picked);
    assertNotSourceTargetLocale('fill', code, ctx.paths.sourceLocale, ctx);
    validateTargetLanguageCode(code);
    return [code];
  }
  if (isAllLangToken(raw)) {
    const codes = listOtherLocaleCodes(ctx.paths.localesDir, sourceBase);
    if (codes.length === 0) {
      throw new I18nPruneError('fill: no target locales to fill (besides source).', 'USAGE');
    }
    return codes.map((c) => normalizeLanguageCode(c));
  }
  if (raw.includes(',')) {
    const codes = parseLocaleCodesList(raw);
    for (const c of codes) {
      assertNotSourceTargetLocale('fill', c, ctx.paths.sourceLocale, ctx);
      validateTargetLanguageCode(c);
    }
    return codes;
  }
  const code = normalizeLanguageCode(raw);
  assertNotSourceTargetLocale('fill', code, ctx.paths.sourceLocale, ctx);
  validateTargetLanguageCode(code);
  return [code];
}

async function fillOneLocale(
  ctx: Context,
  opts: FillOptions,
  lang: string,
  sourceMap: Map<string, string>,
): Promise<number> {
  const catalog = getLanguageByCode(lang);
  const targetPath = path.join(ctx.paths.localesDir, `${lang}.json`);
  if (!fileExists(targetPath)) {
    throw new I18nPruneError(`fill: locale file missing: ${targetPath}`, 'USAGE');
  }
  const targetRaw = readJsonFile(targetPath);
  const tLeaves = collectStringLeaves(targetRaw);
  const metaPath = !opts.noMeta ? path.join(ctx.paths.localesDir, `${lang}.meta.json`) : null;
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

  const session = createSessionProgress({ quiet: ctx.run.quiet, json: ctx.run.json });
  try {
    const total = tLeaves.length;
    for (let i = 0; i < tLeaves.length; i++) {
      const leaf = tLeaves[i]!;
      session.progress.tick(i + 1, total, leaf.path);
      const srcVal = sourceMap.get(leaf.path);
      if (srcVal === undefined) continue;
      if (isParityExcluded(leaf.path, leaf.value, ctx.config.policies?.parity)) continue;
      if (leaf.value !== srcVal) continue;
      if (opts.dryRun) {
        changed += 1;
        continue;
      }
      const translated = await translateLeaf(provider, srcVal, 'en', lang);
      next = setAtPath(next, leaf.path, translated);
      changed += 1;
    }
    session.finish();
  } catch (e) {
    session.fail();
    throw e;
  }

  if (!opts.dryRun && changed > 0) {
    writeJsonFile(targetPath, next);
  }
  if (!opts.dryRun && metaPath) {
    writeJsonFile(metaPath, {
      lang,
      englishName: catalog?.english ?? lang,
      nativeName: catalog?.native ?? lang,
      direction: metaDirection,
    });
  }

  if (opts.dryRun) {
    printFillDryRunSummary(
      {
        lang,
        targetPath,
        metaPath,
        showMeta: !opts.noMeta,
        leafTotal: tLeaves.length,
        direction: metaDirection,
      },
      ctx.run,
    );
  }

  return changed;
}

export async function fill(opts: FillOptions): Promise<void> {
  const started = Date.now();
  const ctx = resolveContext();
  const langs = await resolveFillLanguages(ctx, opts);
  const sourcePath = ctx.paths.sourceLocale;
  const sourceRaw = readJsonFile(sourcePath);
  const sourceLeaves = collectStringLeaves(sourceRaw);
  const sourceMap = new Map(sourceLeaves.map((l) => [l.path, l.value]));

  let totalUpdated = 0;
  for (const lang of langs) {
    totalUpdated += await fillOneLocale(ctx, opts, lang, sourceMap);
  }

  const durationMs = Date.now() - started;

  printCommandSummary(
    {
      command: 'fill',
      ok: true,
      durationMs,
      counts: { locales: langs.length, updated: totalUpdated, sourceLeaves: sourceLeaves.length },
    },
    ctx,
  );

  pushReportEntry({
    level: 'info',
    command: 'fill',
    message: 'fill completed',
    data: { locales: langs, updated: totalUpdated, dryRun: Boolean(opts.dryRun) },
  });
  finalizeReportFile(ctx.config, {
    command: 'fill',
    ok: true,
    durationMs,
    counts: { locales: langs.length, updated: totalUpdated },
  });
}
