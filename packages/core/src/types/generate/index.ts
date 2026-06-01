/**
 * Public types for the **`generate`** op. Pattern: types-only files re-exported from this barrel;
 * runtime implementations live under `packages/core/src/generate/`.
 */
export type { GenerateLocaleDisplay } from './localeDisplay.js';
export type {
  GenerateFinalizeSummaryInput,
  GenerateHostHooks,
  GeneratePartialTargetChoice,
  GenerateHostSession,
  GenerateJsonPayload,
  GenerateProgressEmit,
  GenerateRunOptions,
  GenerateRunResult,
  GenerateTargetJsonRow,
  GenerateTargetProgressSummary,
  ProviderAttemptReportJson,
} from './generateRun.js';

export type { GenerateResumeCandidateLeafInput, GenerateResumeRefContext } from './resumeCandidates.js';
export type { RunGenerateResumeLocaleInput } from './resumeRun.js';

export type {
  GenerateRunHooks,
  HandoffEligibilityRow,
  HandoffOffer,
  IncompleteRunDecision,
  IncompleteRunInfo,
  IncompleteRunReason,
} from './hooks.js';
