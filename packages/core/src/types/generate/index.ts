/**
 * Public types for the **`generate`** op. Pattern: types-only files re-exported from this barrel;
 * runtime implementations live under `packages/core/src/generate/`.
 */
export type {
  CoreContext,
  CoreResolvedPaths,
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

export type {
  GenerateRunHooks,
  HandoffEligibilityRow,
  HandoffOffer,
  IncompleteRunDecision,
  IncompleteRunInfo,
  IncompleteRunReason,
} from './hooks.js';
