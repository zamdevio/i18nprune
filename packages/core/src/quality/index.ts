/**
 * Quality engine (pure): parity-adjacent source-identical counting and payload shaping.
 * Subpath candidate: `@i18nprune/core/quality`.
 */
export { computeEnglishIdenticalCounts } from './englishIdentical.js';
export type { QualityJsonData } from '../types/quality/index.js';

export function buildQualityJsonData(input: {
  total: number;
  perFile: Record<string, number>;
  dynamicKeySites: number;
}): import('../types/quality/index.js').QualityJsonData {
  return {
    total: input.total,
    perFile: input.perFile,
    dynamicKeySites: input.dynamicKeySites,
  };
}
