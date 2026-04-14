import { describe, it, expect } from 'vitest';
import { computeSyncedLocaleJson } from '@/core/sync/apply.js';

describe('computeSyncedLocaleJson', () => {
  it('matches merge+prune and detects no change when already aligned', () => {
    const t = { a: 'src', b: { c: 's' } };
    const cur = { a: 't', b: { c: 'u' } };
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
});
