import { describe, expect, it } from 'vitest';
import { DEFAULT_MISSING_LEAF_PLACEHOLDER } from '../../shared/constants/missing.js';
import { MISSING_LEAF_PLACEHOLDER_MAX_LEN, resolveMissingLeafPlaceholder } from '../placeholder.js';

describe('resolveMissingLeafPlaceholder', () => {
  it('uses default when undefined', () => {
    const r = resolveMissingLeafPlaceholder(undefined);
    expect(r.placeholder).toBe(DEFAULT_MISSING_LEAF_PLACEHOLDER);
    expect(r.warnings).toEqual([]);
  });

  it('trims valid strings', () => {
    const r = resolveMissingLeafPlaceholder('  hello  ');
    expect(r.placeholder).toBe('hello');
    expect(r.warnings).toEqual([]);
  });

  it('falls back on empty / whitespace with warning', () => {
    const r = resolveMissingLeafPlaceholder('   ');
    expect(r.placeholder).toBe(DEFAULT_MISSING_LEAF_PLACEHOLDER);
    expect(r.warnings.length).toBe(1);
  });

  it('falls back on non-string with warning', () => {
    const r = resolveMissingLeafPlaceholder(42);
    expect(r.placeholder).toBe(DEFAULT_MISSING_LEAF_PLACEHOLDER);
    expect(r.warnings.length).toBe(1);
  });

  it('falls back when over max length', () => {
    const r = resolveMissingLeafPlaceholder('x'.repeat(MISSING_LEAF_PLACEHOLDER_MAX_LEN + 1));
    expect(r.placeholder).toBe(DEFAULT_MISSING_LEAF_PLACEHOLDER);
    expect(r.warnings.length).toBe(1);
  });
});
