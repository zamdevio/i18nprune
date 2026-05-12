/**
 * Quality engine (pure): parity-adjacent source-identical counting and payload shaping.
 * Subpath candidate: `@i18nprune/core/quality`.
 */
export { buildQualityJsonData } from './payload.js';
export { computeEnglishIdenticalCounts } from './englishIdentical.js';
export { runQuality } from './run.js';
export type { QualityFileLine, QualityHostHooks, QualityJsonData, QualityRunOptions, QualityRunResult } from '../types/quality/index.js';
