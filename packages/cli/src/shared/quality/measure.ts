import path from 'node:path';
import { collectTranslationSurfaceLeaves } from '@i18nprune/core';
import { listHostJsonBasenames, readHostJsonUnknown } from '@/shared/io/hostJson.js';
import { computeEnglishIdenticalCounts, extractor } from '@i18nprune/core';
import { toExtractorScanInput } from '@/shared/extractor/scanInput.js';
import type { Context } from '@/types/core/context/index.js';
import type { QualityOptions } from '@/types/command/quality/index.js';

/**
 * Reads locale files and returns source-identical vs source locale counts (core-backed logic).
 */
export function measureQualityEnglishIdentical(
  ctx: Context,
  opts: QualityOptions,
  input?: { dynamicSitesCount?: number },
): { total: number; perFile: Record<string, number>; dynamicKeySites: number } {
  const dynamicSitesCount =
    input?.dynamicSitesCount ??
    extractor.dynamic.scanProjectDynamicKeySites(toExtractorScanInput(ctx)).length;
  const fs = ctx.adapters.fs;
  const sourcePath = ctx.paths.sourceLocale;
  const sourceRaw = readHostJsonUnknown(sourcePath, fs);
  const sourceLeaves = collectTranslationSurfaceLeaves(sourceRaw);
  const sourceBase = path.basename(sourcePath, '.json');
  const dir = ctx.paths.localesDir;
  const files = listHostJsonBasenames(dir, fs).filter((f) => f !== `${sourceBase}.json`);
  const filtered = opts.target
    ? files.filter((f) => path.basename(f, '.json') === opts.target)
    : files;

  const targets = filtered.map((file) => {
    const full = path.join(dir, file);
    const targetRaw = readHostJsonUnknown(full, fs);
    return { fileBasename: file, leaves: collectTranslationSurfaceLeaves(targetRaw) };
  });

  const { total, perFile } = computeEnglishIdenticalCounts({
    sourceLeaves,
    targets,
    parity: ctx.config.policies?.parity,
  });

  return { total, perFile, dynamicKeySites: dynamicSitesCount };
}
