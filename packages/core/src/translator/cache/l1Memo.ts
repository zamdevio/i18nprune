import type { TranslationProviderId } from '../../types/translator/providers.js';
import type { TranslationResult } from '../../types/translator/result.js';
import { buildTranslateCacheKey } from './cacheKey.js';

export class TranslateCacheL1Memo {
  private readonly entries = new Map<string, TranslationResult>();
  readonly translateConfigEpoch: string;

  constructor(input: { translateConfigEpoch: string }) {
    this.translateConfigEpoch = input.translateConfigEpoch;
  }

  get(key: string): TranslationResult | undefined {
    return this.entries.get(key);
  }

  set(key: string, value: TranslationResult): void {
    this.entries.set(key, value);
  }

  buildKey(input: {
    sourceText: string;
    sourceLang: string;
    targetLang: string;
    providerId: TranslationProviderId;
  }): string {
    return buildTranslateCacheKey({
      ...input,
      translateConfigEpoch: this.translateConfigEpoch,
    });
  }

  size(): number {
    return this.entries.size;
  }
}
