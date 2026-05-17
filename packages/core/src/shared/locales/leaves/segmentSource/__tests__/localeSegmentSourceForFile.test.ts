import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { localeSegmentSourceForFile } from '../localeSegmentSourceForFile.js';

describe('localeSegmentSourceForFile', () => {
  it('uses a POSIX relative path under localesDir for locale_file', () => {
    const localesDir = '/proj/locales';
    const absoluteFile = '/proj/locales/ja.json';
    expect(
      localeSegmentSourceForFile({
        path,
        absoluteFile,
        localesDir,
        structure: 'locale_file',
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
    const o = localeSegmentSourceForFile({
      path,
      absoluteFile,
      localesDir,
      structure: 'locale_file',
    });
    expect(o?.relativePath).toBe('en.json');
    expect(o?.locale).toBe('en');
    expect(o?.file).toBe(absoluteFile);
  });

  it('returns locale_per_dir segment under locale directory', () => {
    const localesDir = '/proj/messages';
    const absoluteFile = '/proj/messages/en/auth.json';
    expect(
      localeSegmentSourceForFile({
        path,
        absoluteFile,
        localesDir,
        structure: 'locale_per_dir',
      }),
    ).toEqual({
      file: absoluteFile,
      locale: 'en',
      relativePath: 'en/auth.json',
    });
  });
});
