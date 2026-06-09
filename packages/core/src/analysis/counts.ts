import { splitDynamicSiteCounts } from '../extractor/dynamic/groups.js';
import type { DynamicKeySite } from '../types/extractor/dynamic/index.js';
import type { ProjectAnalysisCounts } from '../types/analysis/index.js';

/** Fold scan arrays into persisted `analysis.json` count fields. */
export function buildProjectAnalysisCounts(input: {
  keyObservations: number;
  dynamicSites: readonly DynamicKeySite[];
  sourceFilesScanned: number;
  missingKeys: number;
}): ProjectAnalysisCounts {
  const split = splitDynamicSiteCounts(input.dynamicSites);
  return {
    keyObservations: input.keyObservations,
    dynamicSites: split.total,
    dynamicActive: split.active,
    dynamicCommented: split.commented,
    sourceFilesScanned: input.sourceFilesScanned,
    missingKeys: input.missingKeys,
  };
}
