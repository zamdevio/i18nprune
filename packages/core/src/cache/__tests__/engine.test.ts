import { describe, expect, it } from 'vitest';
import { computeInputFilesEpoch, diffProjectFiles } from '../index.js';

describe('cache engine', () => {
  it('computeInputFilesEpoch changes when the tracked map shape changes', () => {
    const a = { 'x.ts': { hash: '1', size: 1, mtimeMs: 0, updatedAt: 't' } };
    const b = {
      'x.ts': { hash: '1', size: 1, mtimeMs: 0, updatedAt: 't' },
      'y.ts': { hash: '2', size: 2, mtimeMs: 0, updatedAt: 't' },
    };
    expect(computeInputFilesEpoch(a)).not.toBe(computeInputFilesEpoch(b));
  });

  it('diffProjectFiles categorizes added, changed, deleted, and unchanged', () => {
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
  });
});
