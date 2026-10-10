import { describe, it, expect, vi } from 'vitest';
import { buildTranslatedLocaleFromSourceLeaves } from '../localeTranslate.js';
import { TranslateRunInterruptedError } from '../../translator/errors/interrupted.js';
import { AbortError } from '../../shared/errors/index.js';
import { TranslateCacheL1Memo } from '../../translator/cache/index.js';
import type { Translator } from '../../types/translator/index.js';

describe('buildTranslatedLocaleFromSourceLeaves', () => {
  it('copies placeholder-only leaves without calling the translator', async () => {
    const translate = vi.fn();
    const provider = { translate } as unknown as Translator;
    const sourceLeaves = [{ path: 'meta', value: '{{who}} · {{status}} · {{priority}}' }];
    const out = await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves,
      working: {},
      existingRaw: null,
      dryRun: false,
      force: false,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'mymemory',
      targetLang: 'zh-cn',
      tickProgress: () => {},
    });
    expect(translate).not.toHaveBeenCalled();
    expect(out.working).toEqual({ meta: '{{who}} · {{status}} · {{priority}}' });
  });

  it('still translates leaves that mix placeholders with real words', async () => {
    const translate = vi.fn(async () => 'hola {{name}}');
    const provider = { translate } as unknown as Translator;
    await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves: [{ path: 'greet', value: 'Hello {{name}}' }],
      working: {},
      existingRaw: null,
      dryRun: false,
      force: false,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'google',
      targetLang: 'es',
      tickProgress: () => {},
    });
    expect(translate).toHaveBeenCalled();
  });

  it('copies preserve paths without calling the translator', async () => {
    const translate = vi.fn();
    const provider = { translate } as unknown as Translator;
    const sourceLeaves = [{ path: 'a', value: 'source' }];
    await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves,
      working: {},
      existingRaw: null,
      preserve: { copyKeys: ['a'] },
      dryRun: false,
      force: false,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'google',
      targetLang: 'fr',
      tickProgress: () => {},
    });
    expect(translate).not.toHaveBeenCalled();
  });

  it('does not call translator for whitespace-only source values', async () => {
    const translate = vi.fn();
    const provider = { translate } as unknown as Translator;
    await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves: [
        { path: 'empty', value: '' },
        { path: 'ws', value: '  \t' },
      ],
      working: {},
      existingRaw: null,
      dryRun: false,
      force: false,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'google',
      targetLang: 'fr',
      tickProgress: () => {},
    });
    expect(translate).not.toHaveBeenCalled();
  });

  it('reports empty-source paths in dry-run for issue surfacing without translate', async () => {
    const translate = vi.fn();
    const provider = { translate } as unknown as Translator;
    const out = await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves: [{ path: 'k', value: '' }],
      working: {},
      existingRaw: null,
      dryRun: true,
      force: false,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'google',
      targetLang: 'fr',
      tickProgress: () => {},
    });
    expect(translate).not.toHaveBeenCalled();
    expect(out.emptySourceLeafPaths).toEqual(['k']);
  });

  it('translates non-preserved leaves when not dry-run', async () => {
    const provider: Translator = {
      translate: async (text) => `${text}-fr`,
    };
    const out = await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves: [{ path: 'k', value: 'hello' }],
      working: {},
      existingRaw: null,
      dryRun: false,
      force: false,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'google',
      targetLang: 'fr',
      tickProgress: () => {},
    });
    expect(out.working).toEqual({ k: 'hello-fr' });
  });

  it('dedupes duplicate source strings via L1 memo within one build pass', async () => {
    const translate = vi.fn(async (text: string) => `${text}-fr`);
    const provider = { translate } as unknown as Translator;
    const translationCache = { l1: new TranslateCacheL1Memo({ translateConfigEpoch: 'test-epoch' }) };
    const out = await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves: [
        { path: 'a', value: 'hello' },
        { path: 'b', value: 'hello' },
      ],
      working: {},
      existingRaw: null,
      dryRun: false,
      force: false,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'google',
      targetLang: 'fr',
      translationCache,
      tickProgress: () => {},
    });
    expect(translate).toHaveBeenCalledOnce();
    expect(out.working).toEqual({ a: 'hello-fr', b: 'hello-fr' });
    expect(out.translateStats.requestAttempts).toBe(1);
    expect(out.translateStats.successfulLeaves).toBe(2);
  });

  it('force re-translates existing manual target strings', async () => {
    const translate = vi.fn(async (text: string) => `${text}-fr`);
    const provider = { translate } as unknown as Translator;
    const out = await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves: [{ path: 'k', value: 'hello' }],
      working: { k: 'hello' },
      existingRaw: { k: 'bonjour' },
      dryRun: false,
      force: true,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'google',
      targetLang: 'fr',
      tickProgress: () => {},
    });
    expect(translate).toHaveBeenCalledOnce();
    expect(out.working).toEqual({ k: 'hello-fr' });
  });

  it('replays onTranslatedLeaf in leaf order when translating in parallel', async () => {
    const order: string[] = [];
    const provider: Translator = {
      translate: async (text) => {
        await new Promise<void>((r) => setTimeout(r, text === 'b' ? 15 : 0));
        return `${text}-fr`;
      },
    };
    await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves: [
        { path: 'a', value: 'a' },
        { path: 'b', value: 'b' },
        { path: 'c', value: 'c' },
      ],
      working: {},
      existingRaw: null,
      dryRun: false,
      force: false,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'google',
      targetLang: 'fr',
      maxParallelTranslates: 3,
      tickProgress: () => {},
      onTranslatedLeaf: async (_s, _t, path) => {
        order.push(path);
      },
    });
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('marks parallel pool tickProgress calls with phase parallel_pool and pool snapshot', async () => {
    const calls: { phase?: string; pool?: { completed: number; total: number } }[] = [];
    const tickProgress = vi.fn(
      (_i: number, _t: number, _p: string, opts?: { phase?: string; pool?: { completed: number; total: number } }) => {
        calls.push({ phase: opts?.phase, pool: opts?.pool });
      },
    );
    const provider: Translator = {
      translate: async (text) => `${text}-fr`,
    };
    await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves: [
        { path: 'a', value: 'a' },
        { path: 'b', value: 'b' },
      ],
      working: {},
      existingRaw: null,
      dryRun: false,
      force: false,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'google',
      targetLang: 'fr',
      maxParallelTranslates: 2,
      tickProgress,
    });
    const poolTicks = calls.filter((c) => c.phase === 'parallel_pool');
    const strictTicks = calls.filter((c) => c.phase !== 'parallel_pool');
    expect(poolTicks.length).toBeGreaterThanOrEqual(2);
    expect(strictTicks.length).toBeGreaterThan(0);
    const withPool = poolTicks.filter((c) => c.pool !== undefined);
    expect(withPool.length).toBeGreaterThan(0);
    const lastPool = withPool[withPool.length - 1]!.pool!;
    expect(lastPool.total).toBe(2);
    expect(lastPool.completed).toBe(2);
  });

  it('preserves partial locale on interrupt and resumes without re-translating completed paths', async () => {
    const flakyProvider: Translator = {
      translate: async (text) => {
        if (text === 'two') throw new Error('HTTP 429');
        return `${text}-fr`;
      },
    };
    let err: unknown;
    try {
      await buildTranslatedLocaleFromSourceLeaves({
        sourceLeaves: [
          { path: 'one', value: 'one' },
          { path: 'two', value: 'two' },
        ],
        working: {},
        existingRaw: null,
        dryRun: false,
        force: false,
        provider: flakyProvider,
        persistStructuredLeafMetadata: false,
        providerId: 'google',
        targetLang: 'fr',
        maxParallelTranslates: 1,
        tickProgress: () => {},
      });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(TranslateRunInterruptedError);
    const partial = (err as TranslateRunInterruptedError).partialLocaleJson as {
      one?: string;
      two?: string;
    };
    expect(partial.one).toBe('one-fr');
    expect(partial.two).toBeUndefined();

    const translate = vi.fn(async (text: string) => `${text}-de`);
    const provider = { translate } as unknown as Translator;
    const out = await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves: [
        { path: 'one', value: 'one' },
        { path: 'two', value: 'two' },
      ],
      working: partial,
      existingRaw: null,
      dryRun: false,
      force: false,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'google',
      targetLang: 'fr',
      maxParallelTranslates: 1,
      tickProgress: () => {},
    });
    expect(translate).toHaveBeenCalledTimes(1);
    expect(translate).toHaveBeenCalledWith('two', 'en', 'fr');
    expect(out.working).toEqual({ one: 'one-fr', two: 'two-de' });
  });

  it('re-translates sentinel-leaked target strings without --force', async () => {
    const translate = vi.fn(async (text: string) => `${text}-ar`);
    const provider = { translate } as unknown as Translator;
    const out = await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves: [{ path: 'greeting', value: 'Hello {{who}}' }],
      working: { greeting: '__ I18NPRUNE_0 __' },
      existingRaw: { greeting: '__ I18NPRUNE_0 __' },
      dryRun: false,
      force: false,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'google',
      targetLang: 'ar',
      tickProgress: () => {},
      sentinelLeakPaths: new Set(['greeting']),
    });
    expect(translate).toHaveBeenCalledOnce();
    expect(out.working).toEqual({ greeting: 'Hello {{who}}-ar' });
    expect(out.sentinelRepairs).toEqual([
      {
        path: 'greeting',
        mode: 'translate',
        from: '__ I18NPRUNE_0 __',
        sourceValue: 'Hello {{who}}',
        to: 'Hello {{who}}-ar',
      },
    ]);
  });

  it('placeholder_copy sentinel leaks without MT when source is placeholder-only', async () => {
    const translate = vi.fn(async (text: string) => text);
    const provider = { translate } as unknown as Translator;
    const out = await buildTranslatedLocaleFromSourceLeaves({
      sourceLeaves: [{ path: 'meta', value: '{{who}} · {{status}}' }],
      working: { meta: '__ I18NPRUNE_0 __ · __ I18NPRUNE_1 __' },
      existingRaw: { meta: '__ I18NPRUNE_0 __ · __ I18NPRUNE_1 __' },
      dryRun: false,
      force: false,
      provider,
      persistStructuredLeafMetadata: false,
      providerId: 'google',
      targetLang: 'ar',
      tickProgress: () => {},
      sentinelLeakPaths: new Set(['meta']),
    });
    expect(translate).not.toHaveBeenCalled();
    expect(out.working).toEqual({ meta: '{{who}} · {{status}}' });
    expect(out.sentinelRepairs).toEqual([
      {
        path: 'meta',
        mode: 'placeholder_copy',
        from: '__ I18NPRUNE_0 __ · __ I18NPRUNE_1 __',
        sourceValue: '{{who}} · {{status}}',
        to: '{{who}} · {{status}}',
      },
    ]);
  });

  it('unwinds the parallel translate pool on abort without inventing a provider failure', async () => {
    const controller = new AbortController();
    const translate = vi.fn(async (text: string) => {
      if (text === 'b') controller.abort();
      await new Promise<void>((r) => setTimeout(r, 5));
      return `${text}-fr`;
    });
    const provider = { translate } as unknown as Translator;
    let err: unknown;
    try {
      await buildTranslatedLocaleFromSourceLeaves({
        sourceLeaves: [
          { path: 'a', value: 'a' },
          { path: 'b', value: 'b' },
          { path: 'c', value: 'c' },
        ],
        working: {},
        existingRaw: null,
        dryRun: false,
        force: false,
        provider,
        persistStructuredLeafMetadata: false,
        providerId: 'google',
        targetLang: 'fr',
        maxParallelTranslates: 2,
        tickProgress: () => {},
        signal: controller.signal,
      });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(TranslateRunInterruptedError);
    expect((err as TranslateRunInterruptedError).cause).toBeInstanceOf(AbortError);
  });
});
