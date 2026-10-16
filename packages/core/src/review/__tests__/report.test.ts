import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildReviewJsonData } from '../report.js';

describe('buildReviewJsonData', () => {
  it('builds locale review payload from loaded source/targets', () => {
    const out = buildReviewJsonData({
      sourceLocalePath: '/tmp/locales/en.json',
      localesDir: '/tmp/locales',
      dynamicKeySites: 2,
      dynamicKeySitesActive: 2,
      dynamicKeySitesCommented: 0,
      sourceLocaleJson: { home: { title: 'Home' } },
      targetLocaleJsonByFile: {
        'ja.json': { home: { title: 'Home' } },
      },
    });
    expect(out.kind).toBe('localeReview');
    expect(out.sourceLocale).toBe('en');
    expect(out.dynamicKeySites).toBe(2);
    expect(out.locales['ja.json']?.stringPaths).toBe(1);
  });

  it('matches aggregate output with or without path stamping', () => {
    const input = {
      sourceLocalePath: '/tmp/locales/en.json',
      localesDir: '/tmp/locales',
      dynamicKeySites: 0,
      dynamicKeySitesActive: 0,
      dynamicKeySitesCommented: 0,
      sourceLocaleJson: { home: { title: 'Home' } },
      targetLocaleJsonByFile: {
        'ja.json': { home: { title: 'Home' } },
      },
    };
    expect(buildReviewJsonData({ ...input, path })).toEqual(buildReviewJsonData(input));
  });

  /**
   * BUG-003 regression: under `locale_per_dir` the source segment path is `locales/en/about.json`,
   * and `basenameNoExt` yields the **segment** name (`about`) instead of the locale code (`en`).
   * `kits identical` then resolved `locales/about.json` and aborted with `io.read_failed`.
   */
  it('reports the locale code, not the segment stem, for locale_per_dir source paths', () => {
    const out = buildReviewJsonData({
      sourceLocalePath: '/tmp/locales/en/about.json',
      localesDir: '/tmp/locales',
      dynamicKeySites: 0,
      dynamicKeySitesActive: 0,
      dynamicKeySitesCommented: 0,
      sourceLocaleJson: { home: { title: 'Home' } },
      targetLocaleJsonByFile: {
        'so/about.json': { home: { title: 'Home' } },
      },
      path,
      layoutStructure: 'locale_per_dir',
    });
    expect(out.sourceLocale).toBe('en');
    // The source segment must still be excluded from the target map by its filename key.
    expect(Object.keys(out.locales)).toEqual(['so/about.json']);
  });

  it('keeps basename semantics for locale_file layouts', () => {
    const out = buildReviewJsonData({
      sourceLocalePath: '/tmp/locales/en.json',
      localesDir: '/tmp/locales',
      dynamicKeySites: 0,
      dynamicKeySitesActive: 0,
      dynamicKeySitesCommented: 0,
      sourceLocaleJson: { home: { title: 'Home' } },
      targetLocaleJsonByFile: { 'ja.json': { home: { title: 'Home' } } },
      path,
      layoutStructure: 'locale_file',
    });
    expect(out.sourceLocale).toBe('en');
  });
});
