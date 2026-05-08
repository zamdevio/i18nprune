import type {
  LocaleMetadataReport,
  LocaleMetadataRepairReason,
} from '@/types/core/localeLeaves/index.js';

function zeroByReason(): Record<LocaleMetadataRepairReason, number> {
  return {
    legacy_string_promoted: 0,
    non_object_replaced: 0,
    missing_value: 0,
    invalid_status: 0,
    invalid_confidence: 0,
    invalid_needs_review: 0,
    invalid_needs_translation_again: 0,
    invalid_source: 0,
    canonical_metadata_materialized: 0,
  };
}

/** Per-file **`localeMetadataReports`** row when sync does not run `applyLocaleLeafMode` (no `--metadata` / `--strip-metadata`). */
export function idleLocaleMetadataReportForSkippedSync(totalSourceLeafPaths: number): LocaleMetadataReport {
  return {
    mode: 'legacy_string',
    totalSourceLeafPaths,
    unchangedLeaves: totalSourceLeafPaths,
    structuredLeavesWritten: 0,
    promotedLegacyLeaves: 0,
    repairedCorruptLeaves: 0,
    strippedStructuredLeaves: 0,
    missingPathsHydratedFromSource: 0,
    byReason: zeroByReason(),
    changedPathsSample: [],
    leafDecisions: [],
  };
}
