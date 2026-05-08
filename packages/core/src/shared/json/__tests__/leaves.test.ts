import { describe, it, expect } from 'vitest';
import { collectStringLeaves } from '../leaves.js';

describe('collectStringLeaves', () => {
  it('collects nested paths', () => {
    const leaves = collectStringLeaves({ a: { b: 'x' }, c: [{ d: 'y' }] });
    const paths = leaves.map((l) => l.path).sort();
    expect(paths).toEqual(['a.b', 'c[0].d']);
  });
});
