import type { TranslationProviderId } from './providers.js';

export type HandoffEligibilityRow = {
  readonly id: TranslationProviderId;
  /** True only when this row is first in the eligible list and is `google`. */
  readonly recommended: boolean;
};

export type HandoffCatalogBuildResult = {
  readonly eligibleRows: readonly HandoffEligibilityRow[];
  /** Human-readable reason per provider id filtered out (for empty-pool messages). */
  readonly ineligibleReasons: Readonly<Record<string, string>>;
};
