import { describe, it, expect } from 'vitest';
import {
  collectDeclaredSyncKeepPrefixes,
  expandSchemaPathsForPreserve,
  filterOutPreservedPaths,
  isPreservePath,
  mergeSyncKeepPrefixes,
  normalizeSyncKeepPrefix,
  partitionPreserve,
} from '../preserve.js';

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

  it('normalizeSyncKeepPrefix strips trailing dots', () => {
    expect(normalizeSyncKeepPrefix('navigation.')).toBe('navigation');
    expect(normalizeSyncKeepPrefix('navigation.items.')).toBe('navigation.items');
  });

  it('collectDeclaredSyncKeepPrefixes folds copyPrefixes, uncertainPrefixes, copyKeys', () => {
    expect(
      collectDeclaredSyncKeepPrefixes({
        copyPrefixes: ['navigation.'],
        uncertainPrefixes: ['seo.routes'],
        copyKeys: ['brand.tagline'],
      }).sort(),
    ).toEqual(['brand.tagline', 'navigation', 'seo.routes']);
  });

  it('mergeSyncKeepPrefixes dedupes auto + declared', () => {
    expect(mergeSyncKeepPrefixes(['navigation', 'other'], { copyPrefixes: ['navigation.'] }).sort()).toEqual([
      'navigation',
      'other',
    ]);
  });

  it('expandSchemaPathsForPreserve adds source leaves under copyPrefixes and uncertainPrefixes', () => {
    const schema = new Set(['app.title']);
    const source = ['app.title', 'navigation.items.home', 'seo.routes.about', 'other.x'];
    const expanded = expandSchemaPathsForPreserve(schema, source, {
      copyPrefixes: ['navigation.'],
      uncertainPrefixes: ['seo.routes'],
    });
    expect([...expanded].sort()).toEqual([
      'app.title',
      'navigation.items.home',
      'seo.routes.about',
    ]);
  });
});
