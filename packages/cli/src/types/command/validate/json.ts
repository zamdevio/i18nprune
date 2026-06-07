/**
 * Payload shape for `i18nprune validate --json`.
 * Treat as **additive** — new fields may appear.
 */
import type { LocaleSuggestion } from '@i18nprune/core';

export type ValidateJsonOutput = {
  missing: string[];
  /** Total literal key observations scanned (matches `keyObservations.count`). Not the missing-key count — use `missing.length`. */
  count: number;
  dynamic: {
    count: number;
  };
  keyObservations: {
    count: number;
  };
  /** Cross-op next-step hints (additive). */
  suggestions?: LocaleSuggestion[];
};
