import { describe, expect, it } from 'vitest';
import { createRuntimeAdapters } from '../../../../runtime/node/index.js';
import { buildLocaleJsonByTagFromArchive } from '../buildLocaleJsonByTag.js';

describe('buildLocaleJsonByTagFromArchive', () => {
  const { path } = createRuntimeAdapters();
  const root = '/project/messages';
  const resolveArchiveAbsolute = (rel: string) => path.join('/project', rel);

  it('maps flat_file locale_file by locale code', () => {
    const files: Record<string, string> = {
      'messages/en.json': '{"a":1}',
      'messages/fr.json': '{"a":2}',
    };
    const out = buildLocaleJsonByTagFromArchive({
      localesDirAbsolute: root,
      archiveRelPaths: Object.keys(files),
      resolveArchiveAbsolute,
      path,
      locales: { source: 'messages/en.json', directory: 'messages', mode: 'flat_file', structure: 'locale_file' },
      readText: (rel) => files[rel],
    });
    expect(out.en).toEqual({ a: 1 });
    expect(out.fr).toEqual({ a: 2 });
  });

  it('maps locale_per_dir by first path segment', () => {
    const files: Record<string, string> = {
      'messages/en/auth.json': '{"x":1}',
      'messages/en/common.json': '{"y":2}',
    };
    const out = buildLocaleJsonByTagFromArchive({
      localesDirAbsolute: root,
      sourceLocaleAbsolute: `${root}/en/auth.json`,
      archiveRelPaths: Object.keys(files),
      resolveArchiveAbsolute,
      path,
      locales: {
        source: 'messages/en/auth.json',
        directory: 'messages',
        mode: 'locale_directory',
        structure: 'locale_per_dir',
      },
      readText: (rel) => files[rel],
    });
    expect(out.en).toEqual({ x: 1 });
  });

  it('maps feature_bundle by json basename', () => {
    const files: Record<string, string> = {
      'messages/auth/en.json': '{"k":1}',
      'messages/auth/fr.json': '{"k":2}',
    };
    const out = buildLocaleJsonByTagFromArchive({
      localesDirAbsolute: root,
      archiveRelPaths: Object.keys(files),
      resolveArchiveAbsolute,
      path,
      locales: {
        source: 'messages/auth/en.json',
        directory: 'messages',
        mode: 'locale_directory',
        structure: 'feature_bundle',
      },
      readText: (rel) => files[rel],
    });
    expect(out.en).toEqual({ k: 1 });
    expect(out.fr).toEqual({ k: 2 });
  });
});
