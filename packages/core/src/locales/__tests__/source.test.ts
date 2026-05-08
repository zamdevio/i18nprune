import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import {
  assertNotSourceTargetLocale,
  excludeSourceLocaleSlugs,
  getDisplaySourceLocaleCode,
  getSourceLocaleSlug,
  isSourceLocaleSlug,
} from '../source.js';
import { I18nPruneError } from '../../shared/errors/index.js';

describe('source locale helpers', () => {
  const rt = createNodeRuntimeAdapters();
  const fakeEn = path.join('/proj', 'locales', 'en.json');

  it('getSourceLocaleSlug normalizes basename', () => {
    expect(getSourceLocaleSlug(rt.path, fakeEn)).toBe('en');
    expect(getSourceLocaleSlug(rt.path, path.join('/p', 'locales', 'pt-BR.json'))).toBe('pt-br');
  });

  it('excludeSourceLocaleSlugs drops source slug', () => {
    expect(excludeSourceLocaleSlugs(rt.path, ['en', 'ar', 'pt'], fakeEn)).toEqual(['ar', 'pt']);
  });

  it('isSourceLocaleSlug compares normalized', () => {
    expect(isSourceLocaleSlug(rt.path, 'EN', fakeEn)).toBe(true);
    expect(isSourceLocaleSlug(rt.path, 'pt', fakeEn)).toBe(false);
  });

  it('getDisplaySourceLocaleCode matches normalized basename', () => {
    expect(getDisplaySourceLocaleCode({ paths: { sourceLocale: fakeEn }, path: rt.path })).toBe('en');
  });

  it('assertNotSourceTargetLocale throws for source code', () => {
    expect(() =>
      assertNotSourceTargetLocale('generate', 'en', fakeEn, {
        paths: { sourceLocale: fakeEn },
        path: rt.path,
      }),
    ).toThrow(I18nPruneError);
  });
});
