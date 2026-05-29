import type { DynamicKeySite } from '../types/extractor/dynamic/index.js';
import type { KeyObservation } from '../types/extractor/keySites/index.js';
import { computeMissingLiteralKeysFromLeaves, computeMissingLiteralKeysFromResolvedKeys } from './missingLiterals.js';
import type { TranslationSurfaceLeaf } from '../types/locales/leaves/translationSurface.js';

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
  sourceLocaleJson?: unknown;
  /** Preferred for multi-segment layouts — merged source leaves across all segments. */
  sourceLocaleLeaves?: ReadonlyArray<Pick<TranslationSurfaceLeaf, 'path'>>;
  resolvedKeys: ReadonlySet<string>;
  keyObservations: KeyObservation[];
  dynamicSites: DynamicKeySite[];
}): ValidateScanPayload {
  const missing =
    input.sourceLocaleLeaves !== undefined
      ? computeMissingLiteralKeysFromLeaves(input.sourceLocaleLeaves, input.resolvedKeys)
      : computeMissingLiteralKeysFromResolvedKeys(input.sourceLocaleJson ?? {}, input.resolvedKeys);
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