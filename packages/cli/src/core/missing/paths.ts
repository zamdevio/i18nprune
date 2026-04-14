import { collectStringLeaves } from '@/core/json/index.js';
import {
  compareDottedPathDepth,
  computeMissingLiteralKeys,
  resolvedLiteralKeysInProject,
} from '@/core/validate/missingLiterals.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { readJsonFile } from '@/utils/fs/index.js';
import type { Context } from '@/types/core/context/index.js';

/**
 * Reads the `missing` string array from a `validate --json` report file.
 */
export function readMissingPathsFromValidateReport(reportPath: string): string[] {
  const raw = readJsonFile(reportPath);
  if (!raw || typeof raw !== 'object') {
    throw new I18nPruneError(`Report file must be a JSON object: ${reportPath}`, 'USAGE');
  }
  const m = (raw as { missing?: unknown }).missing;
  if (!Array.isArray(m)) {
    throw new I18nPruneError(`Report JSON must contain a string array "missing": ${reportPath}`, 'USAGE');
  }
  const out: string[] = [];
  for (const x of m) {
    if (typeof x === 'string' && x.length > 0) out.push(x);
  }
  return out;
}

export type ResolveMissingPathsInput = {
  /** When set, paths come from {@link readMissingPathsFromValidateReport} and are filtered to the scan. */
  fromReport?: string;
};

/**
 * Paths to add as empty strings in target locale JSON: either from a validate report or a fresh scan.
 */
export function resolvePathsToAddForMissing(
  ctx: Context,
  localeJson: unknown,
  input: ResolveMissingPathsInput,
): { toAdd: string[]; skippedNotInScan: string[] } {
  const used = resolvedLiteralKeysInProject(ctx);
  const keySet = new Set(collectStringLeaves(localeJson).map((l) => l.path));

  if (input.fromReport) {
    const fromReport = readMissingPathsFromValidateReport(input.fromReport);
    const skippedNotInScan = fromReport.filter((p) => !used.has(p));
    const candidates = fromReport.filter((p) => used.has(p) && !keySet.has(p));
    return {
      toAdd: [...new Set(candidates)].sort(compareDottedPathDepth),
      skippedNotInScan: [...new Set(skippedNotInScan)],
    };
  }

  const missing = computeMissingLiteralKeys(ctx, localeJson);
  return { toAdd: missing, skippedNotInScan: [] };
}
