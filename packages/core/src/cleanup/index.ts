/**
 * Cleanup engine (pure): compute removable candidate keys and apply removals to locale JSON.
 * Ripgrep checks and filesystem orchestration stay in the host (CLI).
 */
export { computeCleanupCandidateKeys, pathUnderRoot } from './candidates.js';
export { applyCleanupKeysToLocaleJson } from './apply.js';
export { emitCleanupStringPresenceEvidence, resolveCleanupEvidenceListWindow } from './evidenceEmit.js';
export {
  createCleanupLocaleWritePlan,
  createCleanupSourceWritePlan,
  emitCleanupAbortMessage,
  emitCleanupAskIgnoredMessage,
  emitCleanupWriteDone,
  emitCleanupWriteIntro,
  runCleanup,
  writeCleanupPlan,
} from './run.js';
export { resolveCleanupKeysWithStringPresencePolicy } from './stringPresence.js';
export {
  listCleanupSourceSegmentsForKeys,
  listCleanupSourceSegmentPaths,
  readCleanupSourceLeaves,
} from './sourceSurface.js';
export type { CleanupSourceSegmentRef } from '../types/cleanup/sourceSurface.js';
export type { CleanupCandidateInput } from './candidates.js';
export { resolveCleanupTargetLocaleCodes } from './resolveTargets.js';
export type {
  CleanupHostHooks,
  CleanupJsonOutput,
  CleanupJsonRunSummary,
  CleanupJsonTargetEntry,
  CleanupLocaleSlice,
  CleanupRunOptions,
  CleanupRunResult,
  CleanupSegmentWrite,
  CleanupSkippedTarget,
  CleanupWritePlan,
} from '../types/cleanup/index.js';
export type {
  CleanupStringPresenceEvidence,
  ResolveCleanupKeysWithStringPresenceInput,
} from './stringPresence.js';
