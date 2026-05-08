import { isParityExcluded } from '../policies/parity.js';
import type { ReviewLocaleStats } from '../types/review/index.js';
import type { ParityPolicy } from '../types/policies/index.js';
import type { ReviewLeafRow } from './collectReviewLeaves.js';

function bump(m: Record<string, number>, key: string): void {
  m[key] = (m[key] ?? 0) + 1;
}

export function aggregateReviewRows(
  rows: ReviewLeafRow[],
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
