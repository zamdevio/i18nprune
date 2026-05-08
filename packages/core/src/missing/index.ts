/**
 * Missing engine (pure): parse validate report missing paths and compute add plans.
 * Subpath candidate: `@i18nprune/core/missing`. Host scan + file I/O stay in the CLI.
 */
export { DEFAULT_MISSING_LEAF_PLACEHOLDER } from '../shared/constants/missing.js';
export { MISSING_LEAF_PLACEHOLDER_MAX_LEN, resolveMissingLeafPlaceholder } from './placeholder.js';
export { parseMissingArrayFromValidateReportJson, planMissingPathsFromReport } from './validateReport.js';
export { resolveMissingPathsPlan } from './resolvePaths.js';
export type { ResolveMissingPathsPlanInput } from '../types/missing/index.js';
