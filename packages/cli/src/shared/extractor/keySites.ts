import { extractor } from '@i18nprune/core';
import { toExtractorScanInput } from './scanInput.js';
import type { Context } from '@/types/core/context/index.js';
import type { KeyObservation } from '@/types/core/extractor/keySites/index.js';
import type { ProjectLiteralKeyUsage } from '@/types/core/extractor/keySites/index.js';

export const literalKeyUsageFromObservations = extractor.keySites.literalKeyUsageFromObservations;

/** Scan all source files under `srcRoot` and return key observations with file paths. */
export function scanProjectKeyObservations(ctx: Context): KeyObservation[] {
  return extractor.keySites.scanProjectKeyObservations(toExtractorScanInput(ctx));
}

/**
 * Compute per-project key usage with per-file const resolution.
 * This avoids cross-file identifier collisions (for example, duplicate `const NS`).
 */
export function scanProjectLiteralKeyUsage(ctx: Context): ProjectLiteralKeyUsage {
  return extractor.keySites.scanProjectLiteralKeyUsage(toExtractorScanInput(ctx));
}
