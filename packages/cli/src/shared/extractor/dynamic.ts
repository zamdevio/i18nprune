import { extractor } from '@i18nprune/core';
import { toExtractorScanInput } from './scanInput.js';
import type { Context } from '@/types/core/context/index.js';
import type { DynamicKeySite } from '@/types/core/extractor/dynamic/index.js';

/**
 * Reuse merged source text for callers that already have it (e.g. tests).
 * Per-file fields are omitted; comment detection is not applied across merged blobs.
 */
export function analyzeDynamicKeysFromSourceText(
  text: string,
  functions: string[],
): DynamicKeySite[] {
  return extractor.dynamic.findDynamicKeySitesInJavascriptMergedText(text, functions);
}

/**
 * Scan each file under `srcRoot` with a provider chosen by file extension.
 * Paths with no registered provider are skipped (no error).
 */
export function scanProjectDynamicKeySites(ctx: Context): DynamicKeySite[] {
  return extractor.dynamic.scanProjectDynamicKeySites(toExtractorScanInput(ctx));
}

/** Legacy merged-text API (single concatenated blob). */
export function findDynamicKeySites(text: string, functions: string[]): DynamicKeySite[] {
  return extractor.dynamic.findDynamicKeySitesInJavascriptMergedText(text, functions);
}
