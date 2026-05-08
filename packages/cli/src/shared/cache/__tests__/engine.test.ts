import { describe, expect, it } from 'vitest';
import { diffProjectFiles, mergeProjectFilesState } from '../index.js';

describe('shared/cache/engine', () => {
  it('diffs and merges file records', () => {
    const previous = {
      a: { hash: '1', size: 10, mtimeMs: 100, updatedAt: 'x' },
      b: { hash: '2', size: 20, mtimeMs: 200, updatedAt: 'x' },
    };
    const current = {
      b: { hash: '3', size: 21, mtimeMs: 201, updatedAt: 'y' },
      c: { hash: '4', size: 30, mtimeMs: 300, updatedAt: 'y' },
    };
    const delta = diffProjectFiles(previous, current);
    expect(delta.added).toEqual(['c']);
    expect(delta.changed).toEqual(['b']);
    expect(delta.deleted).toEqual(['a']);
    expect(delta.unchanged).toEqual([]);

    const merged = mergeProjectFilesState(previous, current, delta);
    expect(Object.keys(merged).sort()).toEqual(['b', 'c']);
    expect(merged.b?.hash).toBe('3');
  });
});
