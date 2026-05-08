import { describe, expect, it } from 'vitest';
import { computeSyncedLocaleJson, stripStructuredLeafMetadata } from '../apply.js';

describe('computeSyncedLocaleJson', () => {
  it('matches merge+prune and detects no change when already aligned', () => {
    const t = { a: 'src', b: { c: 's' } };
    const cur = { a: 't', b: { c: 'u' } };
    const r = computeSyncedLocaleJson(t, cur, undefined, undefined);
    expect(r.wouldChange).toBe(false);
    expect(r.next).toEqual(cur);
  });

  it('preserves structured locale leaves when the template uses plain strings', () => {
    const t = { a: 'source' };
    const cur = { a: { value: 'translated', status: 'translated', needsReview: false, source: 'manual' } };
    const r = computeSyncedLocaleJson(t, cur, undefined, undefined);
    expect(r.wouldChange).toBe(false);
    expect(r.next).toEqual(cur);
  });

  it('detects change when extra keys exist', () => {
    const t = { a: '1' };
    const cur = { a: '2', b: '3' };
    const r = computeSyncedLocaleJson(t, cur, undefined, undefined);
    expect(r.wouldChange).toBe(true);
    expect(r.next).toEqual({ a: '2' });
  });

  it('strips structured metadata to plain string leaves', () => {
    const cur = {
      a: { value: 'hello', status: 'translated', confidence: 0.9, needsReview: false },
      nested: { b: { value: 'world', source: 'manual' } },
      list: [{ value: 'x', status: 'draft' }, { c: 'keep' }],
      passthrough: { flag: true },
    };
    expect(stripStructuredLeafMetadata(cur)).toEqual({
      a: 'hello',
      nested: { b: 'world' },
      list: ['x', { c: 'keep' }],
      passthrough: { flag: true },
    });
  });
});
