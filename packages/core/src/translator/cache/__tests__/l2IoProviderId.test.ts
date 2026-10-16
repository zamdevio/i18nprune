import { describe, expect, it } from 'vitest';
import { TRANSLATION_PROVIDER_IDS, isTranslationProviderId } from '../../../shared/constants/providers.js';
import { loadTranslationLocaleCacheFile, saveTranslationLocaleCacheFile } from '../l2Io.js';
import type { CacheRuntime, CacheState } from '../../../types/cache/index.js';
import type { TranslationLocaleCacheFile } from '../../../types/translator/cache.js';

const LOCALE_PATH = '/cache/projects/proj/translations/fr.json';

function cacheState(): CacheState {
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
    translationsDir: '/cache/projects/proj/translations',
    readOnly: false,
  };
}

function memoryRuntime(files: Record<string, string> = {}): CacheRuntime {
  const store = new Map(Object.entries(files));
  return {
    fs: {
      exists: (p: string) => store.has(p),
      statKind: (p: string) => (store.has(p) ? 'file' : 'missing'),
      readText: (p: string) => store.get(p) ?? '',
      writeText: (p: string, text: string) => {
        store.set(p, text);
      },
      mkdirp: () => {},
      deleteFile: (p: string) => {
        store.delete(p);
      },
      listDir: () => [],
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

function localeFile(providerId: string): TranslationLocaleCacheFile {
  return {
    version: 1,
    updatedAt: '2020-01-01T00:00:00.000Z',
    targetLang: 'fr',
    inputFilesEpoch: 'epoch-files',
    translateConfigEpoch: 'epoch-translate',
    entries: {
      'entry-key': {
        text: 'bonjour',
        leafMeta: {
          status: 'translated',
          confidence: null,
          needsReview: false,
          needsTranslationAgain: false,
          source: 'generated',
        },
        providerId: providerId as never,
        createdAt: '2020-01-01T00:00:00.000Z',
      },
    },
  };
}

describe('translation cache providerId validation', () => {
  /**
   * Regression: `l2Io.ts` used to carry its own hardcoded provider list that missed `brave`.
   * Every `brave` entry then failed validation as `cache_malformed`, and the maintenance healer
   * deleted the file — so `brave` runs re-translated from scratch on every invocation.
   */
  it('round-trips every registered provider id through save + load', () => {
    for (const providerId of TRANSLATION_PROVIDER_IDS) {
      const runtime = memoryRuntime();
      const state = cacheState();
      const saveWarning = saveTranslationLocaleCacheFile(state, runtime, LOCALE_PATH, localeFile(providerId));
      expect(saveWarning).toBeUndefined();

      const { locale, warnings } = loadTranslationLocaleCacheFile(LOCALE_PATH, runtime);
      expect(warnings).toEqual([]);
      expect(locale?.entries['entry-key']?.providerId).toBe(providerId);
    }
  });

  it('rejects an unregistered provider id', () => {
    const runtime = memoryRuntime({
      [LOCALE_PATH]: JSON.stringify(localeFile('not-a-provider')),
    });
    const { locale, warnings } = loadTranslationLocaleCacheFile(LOCALE_PATH, runtime);
    expect(locale).toBeUndefined();
    expect(warnings[0]?.code).toBe('cache_malformed');
  });

  it('keeps the guard in lockstep with the registry descriptor list', () => {
    expect(TRANSLATION_PROVIDER_IDS.every((id) => isTranslationProviderId(id))).toBe(true);
    expect(isTranslationProviderId('nope')).toBe(false);
  });
});
