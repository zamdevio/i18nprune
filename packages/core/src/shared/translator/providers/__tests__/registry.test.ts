import { describe, expect, it } from 'vitest';
import { resolveTranslator } from '../registry.js';

describe('resolveTranslator', () => {
  it('returns google', () => {
    expect(typeof resolveTranslator({ provider: 'google' }).translate).toBe('function');
  });

  it('returns mymemory', () => {
    expect(typeof resolveTranslator({ provider: 'mymemory' }).translate).toBe('function');
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
});
