import type { DynamicKeySite } from '@/types/core/extractor/dynamic/index.js';
import type { KeyObservation } from '@/types/core/extractor/keySites/index.js';

/**
 * Payload shape for `i18nprune validate --json`.
 * Arrays may be capped in practice (see command implementation); treat as **additive** — new fields may appear.
 */
export type ValidateJsonOutput = {
  missing: string[];
  /** Total literal key observations scanned (matches `keyObservations.count`). Not the missing-key count — use `missing.length`. */
  count: number;
  dynamic: {
    count: number;
    sites: DynamicKeySite[];
  };
  keyObservations: {
    count: number;
    observations: KeyObservation[];
  };
};
