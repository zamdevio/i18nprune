import type { DynamicKeySite } from '../types/extractor/dynamic/index.js';
import type { KeyObservation } from '../types/extractor/keySites/index.js';
import { computeMissingLiteralKeysFromResolvedKeys } from './missingLiterals.js';

/**
 * JSON `data` payload for `validate` (same field meanings as CLI `ValidateJsonOutput`).
 */
export type ValidateScanPayload = {
  missing: string[];
  count: number;
  dynamic: {
    count: number;
  };
  keyObservations: {
    count: number;
  };
};

/**
 * Build validate result data from scan outputs (pure — no filesystem).
 */
export function buildValidateScanPayload(input: {
  sourceLocaleJson: unknown;
  resolvedKeys: ReadonlySet<string>;
  keyObservations: KeyObservation[];
  dynamicSites: DynamicKeySite[];
}): ValidateScanPayload {
  const missing = computeMissingLiteralKeysFromResolvedKeys(input.sourceLocaleJson, input.resolvedKeys);
  const ko = input.keyObservations;
  const dyn = input.dynamicSites;
  return {
    missing,
    count: ko.length,
    dynamic: {
      count: dyn.length,
    },
    keyObservations: {
      count: ko.length,
    },
  };
}