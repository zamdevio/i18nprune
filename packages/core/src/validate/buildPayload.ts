import type { DynamicKeySite } from '../types/extractor/dynamic/index.js';
import type { KeyObservation } from '../types/extractor/keySites/index.js';
import { resolveListWindow } from '../shared/options/index.js';
import type { ListWindowInput, ListWindowResolved } from '../shared/options/index.js';
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
    observations: KeyObservation[];
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
  /** Resolved list window (preferred when host already resolved config). */
  window?: ListWindowResolved;
  /**
   * Portable list window policy for truncating large arrays in the JSON payload.
   * Defaults to the shared core list-window default and hard cap.
   */
  list?: ListWindowInput;
}): ValidateScanPayload {
  const missing = computeMissingLiteralKeysFromResolvedKeys(input.sourceLocaleJson, input.resolvedKeys);
  const ko = input.keyObservations;
  const dyn = input.dynamicSites;
  const window = input.window ?? resolveListWindow(input.list);
  return {
    missing,
    count: ko.length,
    dynamic: {
      count: dyn.length,
    },
    keyObservations: {
      count: ko.length,
      observations: ko.slice(0, window.limit),
    },
  };
}