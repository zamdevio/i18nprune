import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';
import {
  excludeSourceLocaleSlugs,
  getSourceLocaleSlug,
  isSourceLocaleSlug,
  assertNotSourceTargetLocale,
  buildSourceLocaleTruthLabel,
} from '@/shared/locales/source.js';
import { I18nPruneError } from '@i18nprune/core';
import { stripAnsiVisible } from '@/utils/ansi/index.js';

describe('source locale helpers', () => {
  const adapters = createNodeRuntimeAdapters();
  const fakeEn = path.join('/proj', 'locales', 'en.json');

  it('getSourceLocaleSlug normalizes basename', () => {
    expect(getSourceLocaleSlug(adapters.path, fakeEn)).toBe('en');
    expect(getSourceLocaleSlug(adapters.path, path.join('/p', 'locales', 'pt-BR.json'))).toBe('pt-br');
  });

  it('excludeSourceLocaleSlugs drops source slug', () => {
    expect(excludeSourceLocaleSlugs(['en', 'ar', 'pt'], fakeEn, { adapters })).toEqual(['ar', 'pt']);
  });

  it('isSourceLocaleSlug compares normalized', () => {
    expect(isSourceLocaleSlug('EN', fakeEn, { adapters })).toBe(true);
    expect(isSourceLocaleSlug('pt', fakeEn, { adapters })).toBe(false);
  });

  it('assertNotSourceTargetLocale throws for source code', () => {
    expect(() =>
      assertNotSourceTargetLocale('generate', 'en', fakeEn, {
        paths: { sourceLocale: fakeEn, localesDir: '/x', srcRoot: '/x' },
        adapters,
      }),
    ).toThrow(I18nPruneError);
  });

  it('buildSourceLocaleTruthLabel includes slug and phrase (ANSI-safe check)', () => {
    const s = stripAnsiVisible(buildSourceLocaleTruthLabel('en'));
    expect(s).toContain('en');
    expect(s).toContain('source of truth');
  });
});
