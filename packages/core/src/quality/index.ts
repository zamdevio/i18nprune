/**
 * Quality engine (pure): parity-adjacent source-identical counting and payload shaping.
 * Subpath candidate: `@i18nprune/core/quality`.
 */
import type { QualityFileLine, QualityJsonData } from '../types/quality/index.js';

export { computeEnglishIdenticalCounts } from './englishIdentical.js';
export { runQuality } from './run.js';
export type { QualityFileLine, QualityHostHooks, QualityJsonData, QualityRunOptions, QualityRunResult } from '../types/quality/index.js';

export function buildQualityJsonData(input: {
  total: number;
  perFile: Record<string, number>;
  dynamicKeySites: number;
  sourceLocale: string;
  localesDir: string;
  localeCount: number;
  targetLocaleCount: number;
  files: QualityFileLine[];
}): QualityJsonData {
  return {
    total: input.total,
    perFile: input.perFile,
    dynamicKeySites: input.dynamicKeySites,
    sourceLocale: input.sourceLocale,
    localesDir: input.localesDir,
    localeCount: input.localeCount,
    targetLocaleCount: input.targetLocaleCount,
    files: input.files,
  };
}
