import { collectTranslationSurfaceLeaves } from '../shared/locales/leaves/index.js';
import { computeMissingLiteralKeysFromResolvedKeys } from '../validate/index.js';
import type { ResolveMissingPathsPlanInput } from '../types/missing/index.js';
import { planMissingPathsFromReport } from './validateReport.js';

/**
 * Pure planner for `missing`: compute key paths to add into a target locale JSON.
 * If `reportMissingPaths` is provided, keep only entries still present in current scan.
 */
export function resolveMissingPathsPlan(
  input: ResolveMissingPathsPlanInput,
): { toAdd: string[]; skippedNotInScan: string[] } {
  const existingLeafPaths = new Set(collectTranslationSurfaceLeaves(input.localeJson).map((l) => l.path));
  if (input.reportMissingPaths) {
    return planMissingPathsFromReport(input.reportMissingPaths as string[], input.resolvedKeys, existingLeafPaths);
  }
  return {
    toAdd: computeMissingLiteralKeysFromResolvedKeys(input.localeJson, input.resolvedKeys),
    skippedNotInScan: [],
  };
}
