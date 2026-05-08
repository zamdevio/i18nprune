import { describe, expect, it } from 'vitest';
import { buildInconsistencyPreview } from '@/shared/patching/inconsistencyPreview.js';
import type { I18nPruneConfig } from '@i18nprune/core/config';

function makeConfig(): I18nPruneConfig {
  return {
    source: './locales/en.json',
    localesDir: './locales',
    src: './src',
    functions: ['t'],
  };
}

describe('buildInconsistencyPreview', () => {
  it('uses default top of 5', () => {
    const preview = buildInconsistencyPreview({
      config: makeConfig(),
      autofilled: [],
      mismatches: [
        { code: 'ar', field: 'nativeName', current: 'Arabic', recommended: 'العربية' },
        { code: 'ar', field: 'direction', current: 'ltr', recommended: 'rtl' },
        { code: 'he', field: 'nativeName', current: 'Hebrew', recommended: 'עברית' },
        { code: 'he', field: 'direction', current: 'ltr', recommended: 'rtl' },
        { code: 'ur', field: 'nativeName', current: 'Urdu', recommended: 'اردو' },
        { code: 'ur', field: 'direction', current: 'ltr', recommended: 'rtl' },
      ],
    });
    expect(preview.total).toBe(6);
    expect(preview.shown.length).toBe(5);
    expect(preview.remaining).toBe(1);
  });

  it('supports full list output', () => {
    const preview = buildInconsistencyPreview({
      config: makeConfig(),
      full: true,
      autofilled: [],
      mismatches: [
        { code: 'ar', field: 'nativeName', current: 'Arabic', recommended: 'العربية' },
        { code: 'ar', field: 'direction', current: 'ltr', recommended: 'rtl' },
      ],
    });
    expect(preview.shown.length).toBe(2);
    expect(preview.remaining).toBe(0);
  });
});
