import { describe, expect, it } from 'vitest';
import { aggregateReviewRows, mergeReviewLocaleStats } from '../aggregate.js';
import type { TranslationSurfaceLeaf } from '../../types/locales/leaves/index.js';

describe('aggregateReviewRows', () => {
  it('counts legacy and structured leaves', () => {
    const rows: TranslationSurfaceLeaf[] = [
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
    const rows: TranslationSurfaceLeaf[] = [
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

describe('mergeReviewLocaleStats', () => {
  it('sums per-segment stats for one locale code', () => {
    const a = aggregateReviewRows(
      [{ path: 'a', shape: 'legacy_string', value: 'A', confidence: null, needsReview: null }],
      new Map([['a', 'A']]),
      undefined,
    );
    const b = aggregateReviewRows(
      [{ path: 'b', shape: 'legacy_string', value: 'B', confidence: null, needsReview: null }],
      new Map([['b', 'B']]),
      undefined,
    );
    const merged = mergeReviewLocaleStats([a, b]);
    expect(merged.stringPaths).toBe(2);
    expect(merged.legacyLeaves).toBe(2);
    expect(merged.englishIdentical).toBe(2);
  });
});
