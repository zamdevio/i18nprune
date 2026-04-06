import { describe, it, expect } from 'vitest';
import { splitPath, getAtPath, setAtPath, deleteAtPath } from '@/core/json/path/index.js';

describe('json path', () => {
  it('splitPath', () => {
    expect(splitPath('a.b[0].c')).toEqual(['a', 'b', 0, 'c']);
  });

  it('getAtPath', () => {
    expect(getAtPath({ a: { b: 'x' } }, 'a.b')).toBe('x');
  });

  it('setAtPath', () => {
    const out = setAtPath({ a: {} }, 'a.b', 'y');
    expect((out as { a: { b: string } }).a.b).toBe('y');
  });

  it('deleteAtPath', () => {
    const out = deleteAtPath({ a: { b: 1, c: 2 } }, 'a.b') as { a: { c: number } };
    expect(out.a).toEqual({ c: 2 });
  });
});
