import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { healTranslationCacheFiles, prepareTranslationCacheLayout } from '../maintenance.js';
import { resolveLocaleTranslationCachePath } from '../paths.js';
import type { CacheRuntime, CacheState } from '../../../types/cache/index.js';
import { createWin32MemoryCacheRuntime, win32CacheState } from './win32PathRuntime.js';

function cacheState(translationsDir: string): CacheState {
  return {
    enabled: true,
    reason: 'default',
    rootDir: '/cache',
    metaPath: '/cache/meta.json',
    projectId: 'proj',
    projectRoot: '/project',
    projectDir: '/cache/projects/proj',
    filesPath: '/cache/projects/proj/files.json',
    analysisPath: '/cache/projects/proj/analysis.json',
    translationsDir,
    readOnly: false,
  };
}

function memoryRuntime(files: Record<string, string> = {}): CacheRuntime {
  const store = new Map(Object.entries(files));
  return {
    fs: {
      exists: (p: string) => store.has(p),
      statKind: (p: string) => {
        const v = store.get(p);
        if (v === '__dir__') return 'directory';
        return v !== undefined ? 'file' : 'missing';
      },
      readText: (p: string) => store.get(p) ?? '',
      writeText: (p: string, text: string) => {
        store.set(p, text);
      },
      mkdirp: (p: string) => {
        store.set(p, '__dir__');
      },
      deleteFile: (p: string) => {
        store.delete(p);
      },
      listDir: (p: string) => {
        const prefix = p.endsWith('/') ? p : `${p}/`;
        return [...store.keys()]
          .filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
          .map((k) => ({ kind: 'file' as const, name: k.slice(prefix.length) }));
      },
    },
    path: {
      join: (...parts: string[]) => parts.join('/'),
      dirname: (p: string) => p.split('/').slice(0, -1).join('/') || '/',
      basename: (p: string) => p.split('/').pop() ?? p,
      normalize: (p: string) => p,
      relative: () => '',
      resolve: (...parts: string[]) => parts.join('/'),
      isAbsolute: (p: string) => p.startsWith('/'),
    },
    system: { now: () => 1_700_000_000_000, cwd: () => '/project' },
    hashText: (text: string) => `hash:${text}`,
    byteLength: (text: string) => new TextEncoder().encode(text).length,
  } as unknown as CacheRuntime;
}

describe('healTranslationCacheFiles', () => {
  it('deletes malformed per-locale translation cache files', () => {
    const translationsDir = '/cache/projects/proj/translations';
    const badPath = `${translationsDir}/fr.json`;
    const runtime = memoryRuntime({
      [translationsDir]: '__dir__',
      [badPath]: '{ not valid json',
    });
    const warnings = healTranslationCacheFiles(cacheState(translationsDir), runtime);
    expect(warnings.some((w) => w.code === 'cache_malformed')).toBe(true);
    expect(runtime.fs.exists(badPath)).toBe(false);
  });

  it('prepareTranslationCacheLayout mkdirp then heals', () => {
    const translationsDir = '/cache/projects/proj/translations';
    const badPath = `${translationsDir}/de.json`;
    const runtime = memoryRuntime({
      [badPath]: '[]',
    });
    prepareTranslationCacheLayout(cacheState(translationsDir), runtime);
    expect(runtime.fs.exists(badPath)).toBe(false);
  });
});

describe('healTranslationCacheFiles (Win32 paths)', () => {
  it('deletes malformed locale files when translationsDir uses backslashes', () => {
    const projectDir = 'C:\\Users\\me\\.i18nprune\\cache\\projects\\proj';
    const state = win32CacheState(projectDir);
    const runtime = createWin32MemoryCacheRuntime();
    const badPath = resolveLocaleTranslationCachePath(state, runtime, 'fr');
    runtime.fs.mkdirp(path.win32.dirname(badPath));
    runtime.fs.writeText(badPath, '{ not valid json');

    const warnings = healTranslationCacheFiles(state, runtime);

    expect(warnings.some((w) => w.code === 'cache_malformed')).toBe(true);
    expect(runtime.fs.exists(badPath)).toBe(false);
  });
});
