import type { QualityFileLine, QualityJsonData } from '../types/quality/index.js';

export function buildQualityJsonData(input: {
  total: number;
  perFile: Record<string, number>;
  dynamicKeySites: number;
  dynamicKeySitesActive: number;
  dynamicKeySitesCommented: number;
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
    dynamicKeySitesActive: input.dynamicKeySitesActive,
    dynamicKeySitesCommented: input.dynamicKeySitesCommented,
    sourceLocale: input.sourceLocale,
    localesDir: input.localesDir,
    localeCount: input.localeCount,
    targetLocaleCount: input.targetLocaleCount,
    files: input.files,
  };
}
