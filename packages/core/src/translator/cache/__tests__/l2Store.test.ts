import { describe, expect, it, vi } from 'vitest';
import { computeInputFilesEpoch } from '../../../cache/engine.js';
import { TranslateCacheL2Store } from '../l2Store.js';
import { buildTranslateCacheKeyForLocaleFile } from '../cacheKey.js';
import { translateLeafWithGenerateCache } from '../invokeWithL1.js';
import type { CacheRuntime, CacheState } from '../../../types/cache/index.js';
import type { TranslationLocaleCacheFile } from '../../../types/translator/cache.js';
import type { Translator } from '../../../types/translator/index.js';

const TARGET = 'fr';

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

function localePath(translationsDir: string, targetLang: string): string {
  return `${translationsDir}/${targetLang}.json`;
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

describe('TranslateCacheL2Store', () => {
  it('reuses disk entries when epochs match', () => {
    const translationsDir = '/cache/projects/proj/translations';
    const localeFilePath = localePath(translationsDir, TARGET);
    const inputFilesEpoch = 'epoch-files';
    const translateConfigEpoch = 'epoch-translate';
    const key = 'entry-key';
    const disk: TranslationLocaleCacheFile = {
      version: 1,
      updatedAt: '2020-01-01T00:00:00.000Z',
      targetLang: TARGET,
      inputFilesEpoch,
      translateConfigEpoch,
      entries: {
        [key]: {
          text: 'bonjour',
          leafMeta: {
            status: 'translated',
            confidence: null,
            needsReview: false,
            needsTranslationAgain: false,
            source: 'generated',
          },
          providerId: 'google',
          createdAt: '2020-01-01T00:00:00.000Z',
        },
      },
    };
    const runtime = memoryRuntime({ [localeFilePath]: JSON.stringify(disk) });
    const opened = TranslateCacheL2Store.open({
      state: cacheState(translationsDir),
      runtime,
      targetLang: TARGET,
      inputFilesEpoch,
      translateConfigEpoch,
    });
    expect(opened.store.get(key)?.text).toBe('bonjour');
  });

  it('ignores disk entries when inputFilesEpoch changes', () => {
    const translationsDir = '/cache/projects/proj/translations';
    const localeFilePath = localePath(translationsDir, TARGET);
    const translateConfigEpoch = 'epoch-translate';
    const key = 'entry-key';
    const disk: TranslationLocaleCacheFile = {
      version: 1,
      updatedAt: '2020-01-01T00:00:00.000Z',
      targetLang: TARGET,
      inputFilesEpoch: 'old-epoch',
      translateConfigEpoch,
      entries: {
        [key]: {
          text: 'bonjour',
          leafMeta: {
            status: 'translated',
            confidence: null,
            needsReview: false,
            needsTranslationAgain: false,
            source: 'generated',
          },
          providerId: 'google',
          createdAt: '2020-01-01T00:00:00.000Z',
        },
      },
    };
    const runtime = memoryRuntime({ [localeFilePath]: JSON.stringify(disk) });
    const opened = TranslateCacheL2Store.open({
      state: cacheState(translationsDir),
      runtime,
      targetLang: TARGET,
      inputFilesEpoch: 'new-epoch',
      translateConfigEpoch,
    });
    expect(opened.store.get(key)).toBeUndefined();
  });

  it('persists new entries on flush', () => {
    const translationsDir = '/cache/projects/proj/translations';
    const localeFilePath = localePath(translationsDir, TARGET);
    const inputFilesEpoch = computeInputFilesEpoch({}, undefined);
    const translateConfigEpoch = 'epoch-translate';
    const runtime = memoryRuntime();
    const opened = TranslateCacheL2Store.open({
      state: cacheState(translationsDir),
      runtime,
      targetLang: TARGET,
      inputFilesEpoch,
      translateConfigEpoch,
    });
    opened.store.set(
      'abc',
      {
        text: 'hola',
        leafMeta: {
          status: 'translated',
          confidence: null,
          needsReview: false,
          needsTranslationAgain: false,
          source: 'generated',
        },
      },
      'google',
    );
    expect(opened.store.flush()).toBeUndefined();
    const raw = runtime.fs.readText(localeFilePath) as string;
    const parsed = JSON.parse(raw) as TranslationLocaleCacheFile;
    expect(parsed.entries.abc?.text).toBe('hola');
    expect(parsed.inputFilesEpoch).toBe(inputFilesEpoch);
    expect(parsed.targetLang).toBe(TARGET);
  });

  it('lookup L2 through generate cache wrapper without calling provider', async () => {
    const translate = vi.fn();
    const provider = { translate } as unknown as Translator;
    const translateConfigEpoch = 'epoch-translate';
    const translationsDir = '/cache/projects/proj/translations';
    const l2 = TranslateCacheL2Store.open({
      state: cacheState(translationsDir),
      runtime: memoryRuntime(),
      targetLang: TARGET,
      inputFilesEpoch: 'epoch-files',
      translateConfigEpoch,
    }).store;
    const key = buildTranslateCacheKeyForLocaleFile({
      sourceText: 'hello',
      sourceLang: 'en',
      providerId: 'google',
      translateConfigEpoch,
    });
    l2.set(
      key,
      {
        text: 'salut',
        leafMeta: {
          status: 'translated',
          confidence: null,
          needsReview: false,
          needsTranslationAgain: false,
          source: 'generated',
        },
      },
      'google',
    );
    const { result, cacheHit } = await translateLeafWithGenerateCache({
      translationCache: { l2 },
      provider,
      sourceText: 'hello',
      sourceLang: 'en',
      targetLang: TARGET,
      providerId: 'google',
    });
    expect(cacheHit).toBe('l2');
    expect(result.text).toBe('salut');
    expect(translate).not.toHaveBeenCalled();
  });
});
