import type { TranslationProviderId } from '@i18nprune/core';
import type { TargetProgressSummary } from '@/types/core/progress/index.js';
import type { LocaleMetadataReport } from '@/types/core/localeLeaves/index.js';
import type { ProviderAttemptOutcome } from '@/shared/translation/providerFallback.js';

export type ProviderAttemptReport = {
  providerId: TranslationProviderId;
  outcome: ProviderAttemptOutcome;
};

export type FillTargetJsonRow = {
  target: string;
  status: 'written' | 'dry_run';
  updated: number;
  paths: { localeJson: string; metaJson: string | null };
  progress: TargetProgressSummary;
  providerAttempts?: ProviderAttemptReport[];
  winnerProviderId?: TranslationProviderId;
  fallbackCount?: number;
  /** Count of leaves marked for review by translation policy/meta pipeline. */
  markedForReview?: number;
  localeMetadata?: LocaleMetadataReport;
};

/** Payload inside `CliJsonEnvelope<'fill', …>`. */
export type FillJsonPayload = {
  kind: 'fill';
  /** Active translation backend (non-secret). */
  providerId?: TranslationProviderId;
  dryRun: boolean;
  targets: string[];
  /** Total string leaves updated across targets. */
  updated: number;
  sourceLeaves: number;
  dynamicKeySites: number;
  targetResults: FillTargetJsonRow[];
};
