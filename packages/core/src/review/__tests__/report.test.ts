import { describe, expect, it } from 'vitest';
import { buildReviewJsonData } from '../report.js';

describe('buildReviewJsonData', () => {
  it('builds locale review payload from loaded source/targets', () => {
    const out = buildReviewJsonData({
      sourceLocalePath: '/tmp/locales/en.json',
      localesDir: '/tmp/locales',
      dynamicKeySites: 2,
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
});
