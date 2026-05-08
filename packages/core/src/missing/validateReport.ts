import { I18nPruneError } from '../shared/errors/internal.js';
import { compareDottedPathDepth } from '../validate/index.js';

/**
 * Parse the `missing` string array from an already-loaded validate `--json` report object.
 * @param sourceLabel - appended to errors (e.g. file path) for actionable CLI messages.
 */
export function parseMissingArrayFromValidateReportJson(raw: unknown, sourceLabel = ''): string[] {
  const suffix = sourceLabel ? `: ${sourceLabel}` : '';
  if (!raw || typeof raw !== 'object') {
    throw new I18nPruneError(`Report file must be a JSON object${suffix}`, 'USAGE');
  }
  const m = (raw as { missing?: unknown }).missing;
  if (!Array.isArray(m)) {
    throw new I18nPruneError(`Report JSON must contain a string array "missing"${suffix}`, 'USAGE');
  }
  const out: string[] = [];
  for (const x of m) {
    if (typeof x === 'string' && x.length > 0) out.push(x);
  }
  return out;
}

/**
 * From paths listed in a validate report: which to insert vs skipped because not in current scan.
 */
export function planMissingPathsFromReport(
  reportPaths: string[],
  usedLiteralKeys: ReadonlySet<string>,
  existingLeafPaths: ReadonlySet<string>,
): { toAdd: string[]; skippedNotInScan: string[] } {
  const skippedNotInScan = reportPaths.filter((p) => !usedLiteralKeys.has(p));
  const candidates = reportPaths.filter((p) => usedLiteralKeys.has(p) && !existingLeafPaths.has(p));
  return {
    toAdd: [...new Set(candidates)].sort(compareDottedPathDepth),
    skippedNotInScan: [...new Set(skippedNotInScan)],
  };
}
