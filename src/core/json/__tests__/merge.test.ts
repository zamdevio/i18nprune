import { describe, it, expect } from 'vitest';
import { mergeToTemplateShape, pruneToTemplateShape } from '@/core/json/index.js';

describe('merge/prune', () => {
  it('prune removes extra keys', () => {
    const t = { a: '1' };
    const x = { a: '2', b: '3' };
    expect(pruneToTemplateShape(t, x)).toEqual({ a: '2' });
  });

  it('merge keeps target strings where template matches', () => {
    const t = { a: 'src' };
    const x = { a: 'translated' };
    expect(mergeToTemplateShape(t, x, undefined)).toEqual({ a: 'translated' });
  });
});
