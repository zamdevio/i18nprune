import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RuntimeDirEntry } from '../../../../types/runtime/fs.js';
import type { RuntimeFsPort } from '../../../../types/runtime/fs.js';
import { resolveLocalesLayout } from '../../layout/resolveLayout.js';
import { listLocaleCodes } from '../listLocaleCodes.js';
import { listLocaleSegments } from '../listLocaleSegments.js';
import {
  localeSegmentRefFromAbsolute,
  resolveLocaleSegmentAbsolutePath,
} from '../resolveSegmentPath.js';

function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

function createMemFs(files: Record<string, string>): RuntimeFsPort {
  const fileMap = new Map<string, string>();
  const dirs = new Set<string>();

  for (const [filePath, content] of Object.entries(files)) {
    const normalized = normalizePath(filePath);
    fileMap.set(normalized, content);
    let dir = path.dirname(normalized);
    while (dir && dir !== '/' && dir !== '.') {
      dirs.add(dir);
      dir = path.dirname(dir);
    }
  }

  return {
    exists: (filePath) => {
      const n = normalizePath(filePath);
      return fileMap.has(n) || dirs.has(n);
    },
    readText: (filePath) => {
      const value = fileMap.get(normalizePath(filePath));
      if (value === undefined) throw new Error(`missing ${filePath}`);
      return value;
    },
    statKind: (filePath) => {
      const n = normalizePath(filePath);
      if (fileMap.has(n)) return 'file';
      if (dirs.has(n)) return 'directory';
      return 'missing';
    },
    listDir: (dirPath) => {
      const normalized = normalizePath(dirPath);
      const prefix = normalized === '/' ? '/' : `${normalized}/`;
      const names = new Map<string, RuntimeDirEntry['kind']>();
      for (const filePath of fileMap.keys()) {
        if (!filePath.startsWith(prefix)) continue;
        const rest = filePath.slice(prefix.length);
        if (!rest || rest.includes('/')) continue;
        names.set(rest, 'file');
      }
      for (const dir of dirs) {
        if (!dir.startsWith(prefix) || dir === normalized) continue;
        const rest = dir.slice(prefix.length);
        if (!rest || rest.includes('/')) continue;
        names.set(rest, 'directory');
      }
      return [...names].map(([name, kind]) => ({ name, kind }));
    },
    writeText: () => {},
    deleteFile: () => {},
    mkdirp: () => {},
  };
}

describe('listLocaleSegments / listLocaleCodes', () => {
  it('flat_file + locale_file lists root json files', () => {
    const root = '/proj/locales';
    const layout = resolveLocalesLayout({ source: 'locales/en.json', directory: 'locales' }, root);
    const fs = createMemFs({
      [`${root}/en.json`]: '{}',
      [`${root}/fr.json`]: '{}',
      [`${root}/en.meta.json`]: '{}',
    });
    const { segments } = listLocaleSegments({ layout, fs, path });
    expect(segments.map((s) => s.relativePath)).toEqual(['en.json', 'fr.json']);
    expect(listLocaleCodes({ layout, fs, path }).codes).toEqual(['en', 'fr']);
  });

  it('locale_directory + locale_per_dir lists nested segments per locale dir', () => {
    const root = '/proj/messages';
    const layout = resolveLocalesLayout(
      {
        source: 'messages/en/auth.json',
        directory: 'messages',
        mode: 'locale_directory',
        structure: 'locale_per_dir',
      },
      root,
    );
    const fs = createMemFs({
      [`${root}/en/auth.json`]: '{}',
      [`${root}/en/dashboard.json`]: '{}',
      [`${root}/fr/auth.json`]: '{}',
      [`${root}/orphan.json`]: '{}',
    });
    const { segments } = listLocaleSegments({ layout, fs, path });
    expect(segments.map((s) => s.relativePath).sort()).toEqual([
      'en/auth.json',
      'en/dashboard.json',
      'fr/auth.json',
    ]);
    expect(listLocaleCodes({ layout, fs, path }).codes).toEqual(['en', 'fr']);
  });

  it('locale_directory + feature_bundle uses basename locale across feature dirs', () => {
    const root = '/proj/locales';
    const layout = resolveLocalesLayout(
      {
        source: 'locales/auth/en.json',
        directory: 'locales',
        mode: 'locale_directory',
        structure: 'feature_bundle',
      },
      root,
    );
    const fs = createMemFs({
      [`${root}/auth/en.json`]: '{}',
      [`${root}/auth/fr.json`]: '{}',
      [`${root}/dashboard/en.json`]: '{}',
    });
    const { segments } = listLocaleSegments({ layout, fs, path });
    expect(segments.map((s) => `${s.locale}:${s.relativePath}`).sort()).toEqual([
      'en:auth/en.json',
      'en:dashboard/en.json',
      'fr:auth/fr.json',
    ]);
    expect(listLocaleCodes({ layout, fs, path }).codes).toEqual(['en', 'fr']);
  });
});

describe('resolveLocaleSegmentAbsolutePath / localeSegmentRefFromAbsolute', () => {
  const root = '/proj/locales';
  const layout = resolveLocalesLayout({ source: 'locales/en.json', directory: 'locales' }, root);

  it('resolves default flat segment path', () => {
    expect(
      resolveLocaleSegmentAbsolutePath({ layout, path, locale: 'fr' }),
    ).toBe(`${root}/fr.json`);
  });

  it('round-trips absolute segment paths', () => {
    const absolute = `${root}/en.json`;
    const ref = localeSegmentRefFromAbsolute({ layout, path, absolutePath: absolute });
    expect(ref).toEqual({ locale: 'en', relativePath: 'en.json', absolutePath: absolute });
  });
});
