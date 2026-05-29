import { describe, expect, it } from 'vitest';
import { formatGenerateFinalizeSummaryLines } from '../formatFinalizeSummary.js';

describe('formatGenerateFinalizeSummaryLines', () => {
  const base = {
    target: 'ar',
    englishName: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl' as const,
    targetPath: '/proj/messages/app/ar.json',
    leafCount: 9,
    localeSubtitle: 'ar · Arabic · العربية · RTL',
  };

  it('aggregates multi-segment writes', () => {
    const lines = formatGenerateFinalizeSummaryLines({ ...base, wroteSegmentCount: 5 });
    expect(lines).toEqual([
      'ar · Arabic · العربية · RTL',
      'Wrote 5 segment file(s) · 9 leaves total.',
    ]);
  });

  it('uses a single path for one segment', () => {
    const lines = formatGenerateFinalizeSummaryLines({ ...base, wroteSegmentCount: 1, leafCount: 2 });
    expect(lines[1]).toBe('Wrote /proj/messages/app/ar.json (2 leaves).');
  });
});
