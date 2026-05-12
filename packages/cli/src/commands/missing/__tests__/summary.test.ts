import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '@i18nprune/core/config';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import {
  MISSING_DISPLAY_DEFAULT_TOP,
  formatMissingPathsDetailLines,
  resolveMissingHumanDefaultTop,
  sliceMissingPathsForDisplay,
} from '@/commands/missing/summary.js';

describe('resolveMissingHumanDefaultTop', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns internal default', () => {
    expect(resolveMissingHumanDefaultTop(DEFAULT_CONFIG as I18nPruneConfig)).toBe(MISSING_DISPLAY_DEFAULT_TOP);
  });
});

describe('missing summary', () => {
  const paths = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

  it('defaults to first MISSING_DISPLAY_DEFAULT_TOP paths', () => {
    const s = sliceMissingPathsForDisplay(paths, { fullList: false });
    expect(s.visible.length).toBe(MISSING_DISPLAY_DEFAULT_TOP);
    expect(s.omitted).toBe(paths.length - MISSING_DISPLAY_DEFAULT_TOP);
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
    expect(lines[2]).toMatch(/… and \d+ more/);
  });
});
