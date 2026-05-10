import type { TranslationProviderId, TranslateFailureOutcome } from '@i18nprune/core';
import type { TargetProgressSummary } from '@/types/core/progress/index.js';
import type { LocaleMetadataReport } from '@/types/core/localeLeaves/index.js';
import type { ProviderAttemptOutcome } from '@/shared/translation/providerFallback.js';

export type ProviderAttemptReport = {
  providerId: TranslationProviderId;
  outcome: ProviderAttemptOutcome;
  /** Fine-grained taxonomy when `outcome !== 'success'` (mirrors core `ProviderAttemptReportJson`). */
  translateFailureOutcome?: TranslateFailureOutcome;
};

/** One row in `GenerateJsonPayload.targetResults`. */
export type GenerateTargetJsonRow = {
  target: string;
  status: 'written' | 'dry_run' | 'skipped_user_declined';
  /** True when this target was written from a partial translate (policy / hook), not a full success. */
  partial?: boolean;
  progress?: TargetProgressSummary;
  /** Source string leaf count for this target session (same as source JSON). */
  sourceLeafCount?: number;
  preserveCount?: number;
  paritySkip?: number;
  providerAttempts?: ProviderAttemptReport[];
  winnerProviderId?: TranslationProviderId;
  fallbackCount?: number;
  /** Count of leaves marked for review by translation policy/meta pipeline. */
  markedForReview?: number;
  paths?: { localeJson: string; metaJson: string | null };
  localeMetadata?: LocaleMetadataReport;
};

/** Payload inside `CliJsonEnvelope<'generate', …>`. */
export type GenerateJsonPayload = {
  kind: 'generate';
  providerId?: TranslationProviderId;
  dryRun: boolean;
  force: boolean;
  targets: string[];
  dynamicKeySites: number;
  /** Sum of `sourceLeafCount` for targets that were written or dry-run (not user-skipped). */
  leavesProcessed: number;
  targetResults: GenerateTargetJsonRow[];
  partial?: boolean;
  resumeHint?: string;
  markedForReview?: number;
};
