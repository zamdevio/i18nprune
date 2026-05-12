/**
 * Missing engine: parse validate report missing paths, compute add plans, and apply/write missing
 * placeholders through host adapters.
 */
export { DEFAULT_MISSING_LEAF_PLACEHOLDER, MAX_MISSING_TARGET_SUGGESTIONS } from '../shared/constants/missing.js';
export {
  applyMissingPaths,
  emitMissingPathsPreview,
  emitMissingPlaceholderLeavesPreview,
  emitMissingTargetActionMessage,
  emitMissingTargetWriteIntro,
  runMissing,
  writeMissingPaths,
} from './run.js';
export { MISSING_LEAF_PLACEHOLDER_MAX_LEN, resolveMissingLeafPlaceholder } from './placeholder.js';
export { parseMissingArrayFromValidateReportJson, planMissingPathsFromReport } from './validateReport.js';
export { resolveMissingPathsPlan } from './resolvePaths.js';
export type {
  MissingHostHooks,
  MissingJsonTarget,
  MissingJsonOutput,
  MissingPlaceholderLeaf,
  MissingPlaceholderLeafList,
  MissingRunOptions,
  MissingRunResult,
  MissingSkippedTarget,
  MissingTargetKind,
  MissingTargetPlan,
  MissingTargetState,
  MissingWriteInput,
  ResolveMissingPathsPlanInput,
} from '../types/missing/index.js';
