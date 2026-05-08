import { describe, it, expect } from 'vitest';
import { deepClone } from '../clone.js';

describe('deepClone', () => {
  it('clones nested object/array values deeply', () => {
    const input = { a: 1, b: { c: ['x', 'y'] } };
    const out = deepClone(input);
    expect(out).toEqual(input);
    expect(out).not.toBe(input);
    expect(out.b).not.toBe(input.b);
    expect(out.b.c).not.toBe(input.b.c);
  });
});
