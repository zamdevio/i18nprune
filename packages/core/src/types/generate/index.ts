/**
 * Public types for the **`generate`** op. Pattern: types-only files re-exported from this barrel;
 * runtime implementations live under `packages/core/src/generate/`.
 */
export type {
  GenerateFinalizeSummaryInput,
  GenerateHostHooks,
  GenerateHostSession,
  GenerateJsonPayload,
  GenerateProgressEmit,
  GenerateRunOptions,
  GenerateRunResult,
  GenerateTargetJsonRow,
  GenerateTargetProgressSummary,
  MetaLocaleDefaults,
  ProviderAttemptReportJson,
} from './generateRun.js';

export type { GenerateResumeCandidateLeafInput, GenerateResumeRefContext } from './resumeCandidates.js';

export type {
  GenerateRunHooks,
  HandoffEligibilityRow,
  HandoffOffer,
  IncompleteRunDecision,
  IncompleteRunInfo,
  IncompleteRunReason,
} from './hooks.js';
