import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '@/config/defaults.js';
import { ENV_MISSING_DISPLAY_DEFAULT_TOP } from '@/constants/env.js';
import {
  MISSING_DISPLAY_DEFAULT_TOP,
  formatMissingPathsDetailLines,
  resolveMissingHumanDefaultTop,
  sliceMissingPathsForDisplay,
} from '@/core/missing/summary.js';

describe('resolveMissingHumanDefaultTop', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses config.missing.displayDefaultTop when env unset', () => {
    expect(
      resolveMissingHumanDefaultTop({ ...DEFAULT_CONFIG, missing: { displayDefaultTop: 7 } }),
    ).toBe(7);
  });

  it('env overrides config', () => {
    vi.stubEnv(ENV_MISSING_DISPLAY_DEFAULT_TOP, '12');
    expect(
      resolveMissingHumanDefaultTop({ ...DEFAULT_CONFIG, missing: { displayDefaultTop: 7 } }),
    ).toBe(12);
  });

  it('falls back to MISSING_DISPLAY_DEFAULT_TOP', () => {
    expect(resolveMissingHumanDefaultTop(DEFAULT_CONFIG)).toBe(MISSING_DISPLAY_DEFAULT_TOP);
  });
});

describe('missing summary', () => {
  const paths = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

  it('defaults to first MISSING_DISPLAY_DEFAULT_TOP paths', () => {
    const s = sliceMissingPathsForDisplay(paths, { fullList: false });
    expect(s.visible.length).toBe(MISSING_DISPLAY_DEFAULT_TOP);
    expect(s.omitted).toBe(paths.length - MISSING_DISPLAY_DEFAULT_TOP);
  });

  it('--full-list shows all', () => {
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
