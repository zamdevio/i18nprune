import { isParityExcluded } from '../policies/parity.js';
import type { ReviewLocaleStats } from '../types/review/index.js';
import type { ParityPolicy } from '../types/policies/index.js';
import type { TranslationSurfaceLeaf } from '../types/locales/leaves/index.js';

function bump(m: Record<string, number>, key: string): void {
  m[key] = (m[key] ?? 0) + 1;
}

export function aggregateReviewRows(
  rows: TranslationSurfaceLeaf[],
  sourceMap: Map<string, string>,
  parity?: ParityPolicy,
): ReviewLocaleStats {
  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const confidenceBuckets = { none: 0, low: 0, mid: 0, high: 0 };
  let englishIdentical = 0;
  let legacyLeaves = 0;
  let structuredLeaves = 0;
  let needsReviewTrue = 0;
  let needsReviewFalse = 0;
  let needsReviewUnset = 0;
  let structuredLeavesMissingNeedsReview = 0;
  let structuredLeavesMissingConfidence = 0;

  for (const row of rows) {
    if (row.shape === 'legacy_string') {
      legacyLeaves += 1;
      bump(byStatus, 'legacy');
      bump(bySource, 'legacy');
      needsReviewUnset += 1;
      confidenceBuckets.none += 1;
    } else {
      structuredLeaves += 1;
      bump(byStatus, row.status ?? 'unset');
      bump(bySource, row.source ?? 'unset');

      if (row.needsReview === true) needsReviewTrue += 1;
      else if (row.needsReview === false) needsReviewFalse += 1;
      else {
        needsReviewUnset += 1;
        structuredLeavesMissingNeedsReview += 1;
      }

      const c = row.confidence;
      if (c === null) {
        confidenceBuckets.none += 1;
        structuredLeavesMissingConfidence += 1;
      } else if (c < 0.5) confidenceBuckets.low += 1;
      else if (c < 0.85) confidenceBuckets.mid += 1;
      else confidenceBuckets.high += 1;
    }

    const srcVal = sourceMap.get(row.path);
    if (srcVal !== undefined && !isParityExcluded(row.path, row.value, parity) && row.value === srcVal) {
      englishIdentical += 1;
    }
  }

  return {
    stringPaths: rows.length,
    englishIdentical,
    legacyLeaves,
    structuredLeaves,
    needsReviewTrue,
    needsReviewFalse,
    needsReviewUnset,
    structuredLeavesMissingNeedsReview,
    structuredLeavesMissingConfidence,
    byStatus,
    bySource,
    confidenceBuckets,
  };
}

export function formatCountMap(m: Record<string, number>): string {
  return Object.entries(m)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(', ');
}

function mergeCountMaps(target: Record<string, number>, add: Record<string, number>): void {
  for (const [key, count] of Object.entries(add)) {
    target[key] = (target[key] ?? 0) + count;
  }
}

/** Sum per-file review stats into one row for a locale code (multi-segment layouts). */
export function mergeReviewLocaleStats(stats: readonly ReviewLocaleStats[]): ReviewLocaleStats {
  if (stats.length === 0) {
    return {
      stringPaths: 0,
      englishIdentical: 0,
      legacyLeaves: 0,
      structuredLeaves: 0,
      needsReviewTrue: 0,
      needsReviewFalse: 0,
      needsReviewUnset: 0,
      structuredLeavesMissingNeedsReview: 0,
      structuredLeavesMissingConfidence: 0,
      byStatus: {},
      bySource: {},
      confidenceBuckets: { none: 0, low: 0, mid: 0, high: 0 },
    };
  }
  if (stats.length === 1) return stats[0]!;

  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const confidenceBuckets = { none: 0, low: 0, mid: 0, high: 0 };
  let stringPaths = 0;
  let englishIdentical = 0;
  let legacyLeaves = 0;
  let structuredLeaves = 0;
  let needsReviewTrue = 0;
  let needsReviewFalse = 0;
  let needsReviewUnset = 0;
  let structuredLeavesMissingNeedsReview = 0;
  let structuredLeavesMissingConfidence = 0;

  for (const row of stats) {
    stringPaths += row.stringPaths;
    englishIdentical += row.englishIdentical;
    legacyLeaves += row.legacyLeaves;
    structuredLeaves += row.structuredLeaves;
    needsReviewTrue += row.needsReviewTrue;
    needsReviewFalse += row.needsReviewFalse;
    needsReviewUnset += row.needsReviewUnset;
    structuredLeavesMissingNeedsReview += row.structuredLeavesMissingNeedsReview;
    structuredLeavesMissingConfidence += row.structuredLeavesMissingConfidence;
    mergeCountMaps(byStatus, row.byStatus);
    mergeCountMaps(bySource, row.bySource);
    confidenceBuckets.none += row.confidenceBuckets.none;
    confidenceBuckets.low += row.confidenceBuckets.low;
    confidenceBuckets.mid += row.confidenceBuckets.mid;
    confidenceBuckets.high += row.confidenceBuckets.high;
  }

  return {
    stringPaths,
    englishIdentical,
    legacyLeaves,
    structuredLeaves,
    needsReviewTrue,
    needsReviewFalse,
    needsReviewUnset,
    structuredLeavesMissingNeedsReview,
    structuredLeavesMissingConfidence,
    byStatus,
    bySource,
    confidenceBuckets,
  };
}
