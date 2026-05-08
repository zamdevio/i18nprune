import { describe, expect, it } from 'vitest';
import { targetLocaleCoversAllSourcePaths } from '../targetCoverage.js';

describe('targetLocaleCoversAllSourcePaths', () => {
  it('returns true when target has all source paths', () => {
    const source = { a: { b: 'x' }, c: 'y' };
    const target = { a: { b: '1' }, c: '2' };
    expect(targetLocaleCoversAllSourcePaths(source, target)).toBe(true);
  });

  it('returns false when a path is missing', () => {
    const source = { a: { b: 'x' }, c: 'y' };
    const target = { a: { b: '1' } };
    expect(targetLocaleCoversAllSourcePaths(source, target)).toBe(false);
  });
});
