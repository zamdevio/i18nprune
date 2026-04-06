import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
  excludeSourceLocaleSlugs,
  getSourceLocaleSlug,
  isSourceLocaleSlug,
  assertNotSourceTargetLocale,
  buildSourceLocaleTruthLabel,
} from '@/core/locales/source.js';
import { I18nPruneError } from '@/core/errors/index.js';
import { stripAnsiVisible } from '@/utils/ansi/index.js';

describe('source locale helpers', () => {
  const fakeEn = path.join('/proj', 'locales', 'en.json');

  it('getSourceLocaleSlug normalizes basename', () => {
    expect(getSourceLocaleSlug(fakeEn)).toBe('en');
    expect(getSourceLocaleSlug(path.join('/p', 'locales', 'pt-BR.json'))).toBe('pt-br');
  });

  it('excludeSourceLocaleSlugs drops source slug', () => {
    expect(excludeSourceLocaleSlugs(['en', 'ar', 'pt'], fakeEn)).toEqual(['ar', 'pt']);
  });

  it('isSourceLocaleSlug compares normalized', () => {
    expect(isSourceLocaleSlug('EN', fakeEn)).toBe(true);
    expect(isSourceLocaleSlug('pt', fakeEn)).toBe(false);
  });

  it('assertNotSourceTargetLocale throws for source code', () => {
    expect(() =>
      assertNotSourceTargetLocale('generate', 'en', fakeEn, {
        config: {
          source: 'locales/en.json',
          localesDir: 'locales',
          src: 'src',
          functions: ['t'],
        },
        paths: { sourceLocale: fakeEn, localesDir: '/x', srcRoot: '/x' },
      }),
    ).toThrow(I18nPruneError);
  });

  it('buildSourceLocaleTruthLabel includes slug and phrase (ANSI-safe check)', () => {
    const s = stripAnsiVisible(buildSourceLocaleTruthLabel('en'));
    expect(s).toContain('en');
    expect(s).toContain('source of truth');
  });
});
