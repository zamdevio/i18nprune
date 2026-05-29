import { describe, expect, it } from 'vitest';
import { sourceLeavesMissingFromTarget, workingLocaleForGenerate } from '../missingTargetLeaves.js';
import type { TranslationSurfaceLeaf } from '../../types/locales/leaves/translationSurface.js';

const leaf = (path: string, value: string): TranslationSurfaceLeaf => ({
  path,
  value,
  shape: 'legacy_string',
  confidence: null,
  needsReview: null,
});

describe('sourceLeavesMissingFromTarget', () => {
  it('returns all source leaves when target is absent', () => {
    const source = [leaf('a', '1'), leaf('b', '2')];
    expect(sourceLeavesMissingFromTarget(source, null)).toEqual(source);
  });

  it('filters paths already on the merged target document', () => {
    const source = [leaf('a', '1'), leaf('b', '2'), leaf('c', '3')];
    const existing = { a: '1', b: 'kept' };
    const missing = sourceLeavesMissingFromTarget(source, existing);
    expect(missing.map((l) => l.path)).toEqual(['c']);
  });
});

describe('workingLocaleForGenerate', () => {
  it('starts empty unless filling gaps from an existing target', () => {
    expect(workingLocaleForGenerate({ fillMissingOnly: false, existingRaw: { a: '1' } })).toEqual({});
    expect(workingLocaleForGenerate({ fillMissingOnly: true, existingRaw: null })).toEqual({});
    expect(workingLocaleForGenerate({ fillMissingOnly: true, existingRaw: { a: '1', b: '2' } })).toEqual({
      a: '1',
      b: '2',
    });
  });
});
