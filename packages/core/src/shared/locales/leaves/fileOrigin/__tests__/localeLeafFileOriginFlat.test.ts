import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { localeLeafFileOriginForFlatLocaleJson } from '../localeLeafFileOriginFlat.js';

describe('localeLeafFileOriginForFlatLocaleJson', () => {
  it('uses a POSIX relative path under localesDir', () => {
    const localesDir = '/proj/locales';
    const absoluteFile = '/proj/locales/ja.json';
    expect(
      localeLeafFileOriginForFlatLocaleJson({
        path,
        absoluteFile,
        localesDir,
      }),
    ).toEqual({
      file: absoluteFile,
      locale: 'ja',
      relativePath: 'ja.json',
    });
  });

  it('falls back to basename when the file is outside localesDir', () => {
    const localesDir = '/proj/locales';
    const absoluteFile = '/other/en.json';
    const o = localeLeafFileOriginForFlatLocaleJson({
      path,
      absoluteFile,
      localesDir,
    });
    expect(o.relativePath).toBe('en.json');
    expect(o.locale).toBe('en');
    expect(o.file).toBe(absoluteFile);
  });
});
