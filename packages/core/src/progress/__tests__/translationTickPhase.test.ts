import { describe, it, expect } from 'vitest';
import { isTranslationProgressParallelPoolPhase } from '../translationTickPhase.js';

describe('isTranslationProgressParallelPoolPhase', () => {
  it('is true only for parallel_pool phase', () => {
    expect(isTranslationProgressParallelPoolPhase(undefined)).toBe(false);
    expect(isTranslationProgressParallelPoolPhase({})).toBe(false);
    expect(isTranslationProgressParallelPoolPhase({ phase: 'strict' })).toBe(false);
    expect(isTranslationProgressParallelPoolPhase({ phase: 'parallel_pool' })).toBe(true);
  });
});
