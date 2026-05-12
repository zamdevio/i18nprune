import { extractor } from '@i18nprune/core';
import { toExtractorScanInput } from './scanInput.js';
import type { Context } from '@/types/core/context/index.js';
import type { DynamicKeySite } from '@i18nprune/core';

/**
 * Scan each file under `srcRoot` with a provider chosen by file extension.
 * Paths with no registered provider are skipped (no error).
 */
export function scanProjectDynamicKeySites(ctx: Context): DynamicKeySite[] {
  return extractor.dynamic.scanProjectDynamicKeySites(toExtractorScanInput(ctx));
}
