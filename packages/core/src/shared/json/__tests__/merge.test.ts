import { describe, it, expect } from 'vitest';
import { mergeToTemplateShape, pruneToTemplateShape } from '../index.js';

describe('merge/prune', () => {
  it('prune removes extra keys', () => {
    const t = { a: '1' };
    const x = { a: '2', b: '3' };
    expect(pruneToTemplateShape(t, x)).toEqual({ a: '2' });
  });

  it('prune keeps extra keys under uncertain prefixes', () => {
    const t = { a: '1' };
    const x = { a: '2', extra: { k: 'v' } };
    expect(pruneToTemplateShape(t, x, { uncertainKeepPrefixes: ['extra'] })).toEqual({
      a: '2',
      extra: { k: 'v' },
    });
  });

  it('merge keeps target strings where template matches', () => {
    const t = { a: 'src' };
    const x = { a: 'translated' };
    expect(mergeToTemplateShape(t, x, undefined)).toEqual({ a: 'translated' });
  });

  it('merge preserves structured leaf objects when template leaf is string', () => {
    const t = { a: 'src' };
    const x = { a: { value: 'translated', status: 'translated', needsReview: false } };
    expect(mergeToTemplateShape(t, x, undefined)).toEqual({
      a: { value: 'translated', status: 'translated', needsReview: false },
    });
  });

  it('merge retains extra object keys under uncertain prefixes', () => {
    const t = { a: 's' };
    const x = { a: 't', dynamic: { x: 'y' } };
    expect(mergeToTemplateShape(t, x, undefined, { uncertainKeepPrefixes: ['dynamic'] })).toEqual({
      a: 't',
      dynamic: { x: 'y' },
    });
  });
});
