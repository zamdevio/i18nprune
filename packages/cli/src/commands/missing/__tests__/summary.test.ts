import { describe, expect, it } from 'vitest';
import { DEFAULT_LIST_TOP } from '@i18nprune/core';
import { formatMissingPathsDetailLines, sliceMissingPathsForDisplay } from '@/commands/missing/summary.js';

describe('missing summary', () => {
  const paths = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

  it('defaults to DEFAULT_LIST_TOP paths', () => {
    const s = sliceMissingPathsForDisplay(paths, { fullList: false });
    expect(s.visible.length).toBe(DEFAULT_LIST_TOP);
    expect(s.omitted).toBe(paths.length - DEFAULT_LIST_TOP);
  });

  it('--full shows all', () => {
    const s = sliceMissingPathsForDisplay(paths, { fullList: true });
    expect(s).toEqual({ visible: paths, omitted: 0 });
  });

  it('--top N caps listing when not fullList', () => {
    const s = sliceMissingPathsForDisplay(paths, { fullList: false, top: 3 });
    expect(s.visible).toEqual(['a', 'b', 'c']);
    expect(s.omitted).toBe(paths.length - 3);
  });

  it('formatMissingPathsDetailLines adds truncation hint', () => {
    const lines = formatMissingPathsDetailLines(paths, { fullList: false, top: 2 });
    expect(lines[0]).toBe('  a');
    expect(lines[1]).toBe('  b');
    expect(lines[2]).toContain('2 key path(s) shown +');
    expect(lines[2]).toContain('… 10 more (use --full or --top');
  });
});
