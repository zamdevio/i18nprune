import { describe, expect, it, vi } from 'vitest';
import { TranslateCacheL1Memo } from '../l1Memo.js';
import { translateLeafWithL1Memo } from '../invokeWithL1.js';
import { translateCacheL1Enabled } from '../resolveL1.js';
import type { Translator } from '../../../types/translator/index.js';
import type { CoreContext } from '../../../types/context/index.js';

describe('TranslateCacheL1Memo', () => {
  it('dedupes identical source strings within one memo', async () => {
    const translate = vi.fn(async (text: string) => `${text}-fr`);
    const provider = { translate } as unknown as Translator;
    const l1 = new TranslateCacheL1Memo({ translateConfigEpoch: 'epoch-a' });

    const first = await translateLeafWithL1Memo({
      l1Memo: l1,
      provider,
      sourceText: 'hello',
      sourceLang: 'en',
      targetLang: 'fr',
      providerId: 'google',
    });
    const second = await translateLeafWithL1Memo({
      l1Memo: l1,
      provider,
      sourceText: 'hello',
      sourceLang: 'en',
      targetLang: 'fr',
      providerId: 'google',
    });

    expect(translate).toHaveBeenCalledOnce();
    expect(first.cacheHit).toBe(false);
    expect(second.cacheHit).toBe('l1');
    expect(second.result.text).toBe(first.result.text);
  });

  it('uses separate entries per target language', async () => {
    const translate = vi.fn(async (text: string, _sl: string, tl: string) => `${text}-${tl}`);
    const provider = { translate } as unknown as Translator;
    const l1 = new TranslateCacheL1Memo({ translateConfigEpoch: 'epoch-a' });

    await translateLeafWithL1Memo({
      l1Memo: l1,
      provider,
      sourceText: 'hello',
      sourceLang: 'en',
      targetLang: 'fr',
      providerId: 'google',
    });
    await translateLeafWithL1Memo({
      l1Memo: l1,
      provider,
      sourceText: 'hello',
      sourceLang: 'en',
      targetLang: 'de',
      providerId: 'google',
    });

    expect(translate).toHaveBeenCalledTimes(2);
  });

  it('invokes onTranslatedLeaf on cache hits', async () => {
    const provider: Translator = { translate: async (text) => `${text}-fr` };
    const l1 = new TranslateCacheL1Memo({ translateConfigEpoch: 'epoch-a' });
    const onTranslated = vi.fn();

    await translateLeafWithL1Memo({
      l1Memo: l1,
      provider,
      sourceText: 'hello',
      sourceLang: 'en',
      targetLang: 'fr',
      providerId: 'google',
      onTranslated,
    });
    await translateLeafWithL1Memo({
      l1Memo: l1,
      provider,
      sourceText: 'hello',
      sourceLang: 'en',
      targetLang: 'fr',
      providerId: 'google',
      onTranslated,
    });

    expect(onTranslated).toHaveBeenCalledTimes(2);
    expect(onTranslated).toHaveBeenLastCalledWith('hello', 'hello-fr');
  });
});

describe('translateCacheL1Enabled', () => {
  it('bypasses L1 when host passed --no-cache', () => {
    const ctx = {
      cache: { state: { reason: 'cli_no_cache' } },
    } as CoreContext;
    expect(translateCacheL1Enabled(ctx)).toBe(false);
  });

  it('allows L1 when cache is enabled', () => {
    const ctx = {
      cache: { state: { reason: 'default' } },
    } as CoreContext;
    expect(translateCacheL1Enabled(ctx)).toBe(true);
  });
});
