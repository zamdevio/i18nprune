import { describe, it, expect } from 'vitest';
import { finalizePartialTranslatedLocaleForGenerate } from '../normalize.js';
import { ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES } from '../../shared/constants/issueCodes.js';

describe('finalizePartialTranslatedLocaleForGenerate', () => {
  it('emits empty-source warning and counts needsReview after normalization', () => {
    const sourceLeaves = [
      { path: 'a', value: 'x' },
      { path: 'b', value: '' },
    ];
    const sourceMap = new Map(sourceLeaves.map((l) => [l.path, l.value]));
    const working = {
      a: { value: 'translated', needsReview: true, confidence: 0.9 },
      b: '',
    };
    const r = finalizePartialTranslatedLocaleForGenerate({
      sourceLeaves,
      working,
      sourceMap,
      localeLeafResolve: {
        configMode: 'structured',
        metadataFlag: true,
        stripMetadataFlag: false,
      },
      translateStats: {
        requestAttempts: 2,
        retriesMade: 0,
        successfulLeaves: 1,
        failedRequests: 0,
      },
    });
    expect(r.issues.some((i) => i.code === ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES)).toBe(true);
    expect(r.emptySourceLeafCount).toBe(1);
    expect(r.markedForReview).toBeGreaterThanOrEqual(1);
    expect(r.translateStats.successfulLeaves).toBe(1);
  });
});
