import { collectTranslationSurfaceLeaves } from '../shared/locales/leaves/index.js';
import {
  computeMissingLiteralKeysFromLeaves,
  computeMissingLiteralKeysFromResolvedKeys,
} from '../validate/index.js';
import type { ResolveMissingPathsPlanInput } from '../types/missing/index.js';
import { planMissingPathsFromReport } from './validateReport.js';

/**
 * Pure planner for `missing`: compute key paths to add into a target locale JSON.
 * If `reportMissingPaths` is provided, keep only entries still present in current scan.
 */
export function resolveMissingPathsPlan(
  input: ResolveMissingPathsPlanInput,
): { toAdd: string[]; skippedNotInScan: string[] } {
  const existingLeafPaths =
    input.localeLeaves !== undefined
      ? new Set(input.localeLeaves.map((l) => l.path))
      : new Set(collectTranslationSurfaceLeaves(input.localeJson ?? {}).map((l) => l.path));
  if (input.reportMissingPaths) {
    return planMissingPathsFromReport(input.reportMissingPaths as string[], input.resolvedKeys, existingLeafPaths);
  }
  if (input.localeLeaves !== undefined) {
    return {
      toAdd: computeMissingLiteralKeysFromLeaves(input.localeLeaves, input.resolvedKeys),
      skippedNotInScan: [],
    };
  }
  return {
    toAdd: computeMissingLiteralKeysFromResolvedKeys(input.localeJson ?? {}, input.resolvedKeys),
    skippedNotInScan: [],
  };
}
