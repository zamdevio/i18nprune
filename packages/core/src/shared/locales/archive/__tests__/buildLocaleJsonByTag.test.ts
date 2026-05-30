import { describe, expect, it } from 'vitest';
import { webPathRuntime } from '../../../../runtime/web/path.js';
import { buildLocaleJsonByTagFromArchive, listLocaleCodesFromArchive } from '../buildLocaleJsonByTag.js';

describe('buildLocaleJsonByTagFromArchive (edge path)', () => {
  const cwd = '/project';
  const path = webPathRuntime;
  const locales = {
    source: 'en',
    directory: 'locales',
    mode: 'flat_file' as const,
    structure: 'locale_file' as const,
  };
  const textFiles: Record<string, string> = {
    'locales/en.json': '{"a":"A"}',
    'locales/ar.json': '{"a":"A"}',
    'locales/zh-cn.json': '{"a":"A"}',
  };
  const archiveRelPaths = Object.keys(textFiles);
  const localesDirAbsolute = path.resolve(cwd, 'locales');
  const resolveArchiveAbsolute = (rel: string) => path.resolve(cwd, rel);

  it('listLocaleCodesFromArchive discovers flat_file locale basenames', () => {
    const codes = listLocaleCodesFromArchive({
      localesDirAbsolute,
      archiveRelPaths,
      resolveArchiveAbsolute,
      path,
      locales,
    });
    expect(codes).toEqual(['ar', 'en', 'zh-cn']);
  });

  it('buildLocaleJsonByTagFromArchive fills map on edge path runtime', () => {
    const map = buildLocaleJsonByTagFromArchive({
      localesDirAbsolute,
      sourceLocaleAbsolute: path.resolve(cwd, 'locales/en.json'),
      archiveRelPaths,
      resolveArchiveAbsolute,
      path,
      locales,
      readText: (rel) => textFiles[rel],
    });
    expect(Object.keys(map).sort()).toEqual(['ar', 'en', 'zh-cn']);
  });
});
