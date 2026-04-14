import { describe, it, expect } from 'vitest';
import { filterOutPreservedPaths, isPreservePath, partitionPreserve } from '@/core/preserve/index.js';

describe('preserve', () => {
  it('isPreservePath matches copyKeys and prefixes', () => {
    const p = { copyKeys: ['a.b'], copyPrefixes: ['keep.'] };
    expect(isPreservePath('a.b', p)).toBe(true);
    expect(isPreservePath('a.b.c', p)).toBe(true);
    expect(isPreservePath('keep.foo', p)).toBe(true);
    expect(isPreservePath('other', p)).toBe(false);
  });

  it('filterOutPreservedPaths and partitionPreserve', () => {
    const policy = { copyKeys: ['x'] };
    expect(filterOutPreservedPaths(['x', 'y'], policy)).toEqual(['y']);
    expect(partitionPreserve(['x', 'y'], policy)).toEqual({ preserved: ['x'], removable: ['y'] });
  });
});
