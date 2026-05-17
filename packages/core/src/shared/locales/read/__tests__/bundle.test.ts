import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RuntimeDirEntry, RuntimeFsPort } from '../../../../types/runtime/fs.js';
import { resolveLocalesLayout } from '../../layout/resolveLayout.js';
import { readLocaleBundle, readLocalePerDirLocaleSurface } from '../bundle.js';

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

describe('readLocaleBundle', () => {
  const layout = resolveLocalesLayout(
    { source: 'locales/en.json', directory: 'locales' },
    '/proj/locales',
  );

  it('reads flat locale file with text', () => {
    const absoluteFile = path.join('/proj/locales', 'en.json');
    const body = JSON.stringify({ a: 'hi' });
    const res = readLocaleBundle({
      layout,
      fs: createMemFs({ [absoluteFile]: body }),
      path,
      absoluteFile,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.text).toBe(body);
    expect(res.leaves).toHaveLength(1);
    expect(res.leaves[0]?.source?.relativePath).toBe('en.json');
  });

  it('warn-skips on layout path mismatch', () => {
    const res = readLocaleBundle({
      layout,
      fs: createMemFs({}),
      path,
      absoluteFile: '/proj/locales/en/nested.json',
    });
    expect(res.ok).toBe(false);
    expect(res.diagnostics[0]?.code).toBe('locale_read_path_layout_mismatch');
    expect(res.diagnostics[0]?.level).toBe('warn');
  });

  it('reads locale_directory segments via flat reader when path matches', () => {
    const dirLayout = resolveLocalesLayout(
      { source: 'messages/en.json', directory: 'messages', mode: 'locale_directory' },
      '/proj/messages',
    );
    const absoluteFile = '/proj/messages/en/auth.json';
    const body = JSON.stringify({ title: 'Auth' });
    const res = readLocaleBundle({
      layout: dirLayout,
      fs: createMemFs({ [absoluteFile]: body }),
      path,
      absoluteFile,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.leaves[0]?.source?.relativePath).toBe('en/auth.json');
  });
});

describe('readLocalePerDirLocaleSurface', () => {
  it('merges leaves across segments for one locale code', () => {
    const layout = resolveLocalesLayout(
      { source: 'messages/en.json', directory: 'messages', mode: 'locale_directory' },
      '/proj/messages',
    );
    const root = '/proj/messages';
    const fs = createMemFs({
      [`${root}/en/a.json`]: JSON.stringify({ a: 'A' }),
      [`${root}/en/b.json`]: JSON.stringify({ b: 'B' }),
    });
    const res = readLocalePerDirLocaleSurface({
      layout,
      fs,
      path,
      localeCode: 'en',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const paths = res.leaves.map((l) => l.path).sort();
    expect(paths).toEqual(['a', 'b']);
  });
});
