import { describe, expect, it } from 'vitest';
import {
  LIST_WINDOW_DEFAULT_TOP,
  LIST_WINDOW_HARD_CAP,
  applyListWindow,
  resolveListWindow,
} from '../index.js';

describe('resolveListWindow', () => {
  it('uses defaults when input is empty', () => {
    const w = resolveListWindow(undefined);
    expect(w.full).toBe(false);
    expect(w.top).toBe(LIST_WINDOW_DEFAULT_TOP);
    expect(w.limit).toBe(LIST_WINDOW_DEFAULT_TOP);
    expect(w.hardCap).toBe(LIST_WINDOW_HARD_CAP);
    expect(w.clamped).toBe(false);
  });

  it('applies explicit top and clamps to hard cap', () => {
    const w = resolveListWindow({ top: 20_000 });
    expect(w.limit).toBe(LIST_WINDOW_HARD_CAP);
    expect(w.clamped).toBe(true);
  });

  it('full means hard cap', () => {
    const w = resolveListWindow({ full: true, top: 3 });
    expect(w.full).toBe(true);
    expect(w.limit).toBe(LIST_WINDOW_HARD_CAP);
  });

  it('supports custom defaults per operation', () => {
    const w = resolveListWindow({}, { defaultTop: 300, hardCap: 500 });
    expect(w.limit).toBe(300);
    expect(w.hardCap).toBe(500);
  });
});

describe('applyListWindow', () => {
  it('slices by resolved limit', () => {
    const data = Array.from({ length: 20 }, (_, i) => i + 1);
    const out = applyListWindow(data, resolveListWindow({ top: 5 }));
    expect(out).toEqual([1, 2, 3, 4, 5]);
  });
});
