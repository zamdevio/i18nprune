import { describe, it, expect } from 'vitest';
import { isParityExcluded } from '../parity.js';

describe('parity', () => {
  it('isParityExcluded respects keys, prefixes, and values', () => {
    const policy = {
      excludeKeys: ['a.b'],
      excludePrefixes: ['skip.'],
      excludeValues: ['OK'],
    };
    expect(isParityExcluded('a.b', 'x', policy)).toBe(true);
    expect(isParityExcluded('a.b.c', 'x', policy)).toBe(true);
    expect(isParityExcluded('skip.foo', 'x', policy)).toBe(true);
    expect(isParityExcluded('other', 'OK', policy)).toBe(true);
    expect(isParityExcluded('other', 'no', policy)).toBe(false);
  });
});
