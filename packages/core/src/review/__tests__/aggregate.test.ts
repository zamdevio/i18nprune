import { describe, expect, it } from 'vitest';
import { aggregateReviewRows } from '../aggregate.js';
import type { ReviewLeafRow } from '../collectReviewLeaves.js';

describe('aggregateReviewRows', () => {
  it('counts legacy and structured leaves', () => {
    const rows: ReviewLeafRow[] = [
      { path: 'a', shape: 'legacy_string', value: 'A', confidence: null, needsReview: null },
      {
        path: 'b',
        shape: 'structured',
        value: 'B',
        status: 'translated',
        source: 'manual',
        confidence: 0.9,
        needsReview: false,
      },
    ];
    const sourceMap = new Map([
      ['a', 'A'],
      ['b', 'X'],
    ]);
    const s = aggregateReviewRows(rows, sourceMap, undefined);
    expect(s.stringPaths).toBe(2);
    expect(s.legacyLeaves).toBe(1);
    expect(s.structuredLeaves).toBe(1);
    expect(s.englishIdentical).toBe(1);
    expect(s.byStatus.translated).toBe(1);
  });

  it('tracks missing needsReview/confidence for structured leaves', () => {
    const rows: ReviewLeafRow[] = [
      {
        path: 'k',
        shape: 'structured',
        value: 'V',
        status: undefined,
        source: undefined,
        confidence: null,
        needsReview: null,
      },
    ];
    const s = aggregateReviewRows(rows, new Map(), undefined);
    expect(s.structuredLeavesMissingNeedsReview).toBe(1);
    expect(s.structuredLeavesMissingConfidence).toBe(1);
    expect(s.confidenceBuckets.none).toBe(1);
  });
});
