import { describe, expect, it } from 'vitest';
import {
  TRANSLATION_PROVIDER_IDS,
  isTranslationProviderId,
} from '../../../constants/providers.js';
import { listTranslationProviders, resolveTranslator } from '../registry.js';

describe('resolveTranslator', () => {
  it('returns google', () => {
    expect(typeof resolveTranslator({ provider: 'google' }).translate).toBe('function');
  });

  it('returns mymemory', () => {
    expect(typeof resolveTranslator({ provider: 'mymemory' }).translate).toBe('function');
  });

  it('returns brave', () => {
    expect(typeof resolveTranslator({ provider: 'brave' }).translate).toBe('function');
  });

  it('returns brave with a key override', () => {
    expect(typeof resolveTranslator({ provider: 'brave', key: 'custom' }).translate).toBe('function');
  });

  it('returns deepl when apiKey present', () => {
    expect(typeof resolveTranslator({ provider: 'deepl', apiKey: 'x:fx' }).translate).toBe('function');
  });

  it('returns libre when baseUrl present', () => {
    expect(
      typeof resolveTranslator({ provider: 'libre', baseUrl: 'https://libretranslate.com' }).translate,
    ).toBe('function');
  });

  it('returns llm when credentials are set', () => {
    expect(
      typeof resolveTranslator({
        provider: 'llm',
        apiKey: 'k',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
      }).translate,
    ).toBe('function');
  });

  it('descriptors cover every id in the shared constants tuple', () => {
    const descriptorIds = listTranslationProviders()
      .map((d) => d.id)
      .sort();
    expect(descriptorIds).toEqual([...TRANSLATION_PROVIDER_IDS].sort());
  });

  it('the shared guard accepts exactly the registered ids', () => {
    for (const id of TRANSLATION_PROVIDER_IDS) {
      expect(isTranslationProviderId(id)).toBe(true);
    }
    expect(isTranslationProviderId('openai')).toBe(false);
    expect(isTranslationProviderId('')).toBe(false);
  });
});
