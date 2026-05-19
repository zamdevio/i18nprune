import { translateLeaf } from '../../shared/translator/index.js';
import type { Translator } from '../../types/translator/index.js';
import type { TranslationProviderId } from '../../types/translator/providers.js';
import type { TranslateCacheHitLayer, TranslateCacheL1Port, TranslateCacheL2Port, TranslateLeafWithL1Result } from '../../types/translator/cache.js';
import type { GenerateTranslateCache } from '../../types/translator/cache.js';

function buildL1Key(input: {
  l1Memo: TranslateCacheL1Port;
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  providerId: TranslationProviderId;
}): string {
  return input.l1Memo.buildKey({
    sourceText: input.sourceText,
    sourceLang: input.sourceLang,
    targetLang: input.targetLang,
    providerId: input.providerId,
  });
}

function toResult(result: Awaited<ReturnType<typeof translateLeaf>>, cacheHit: TranslateCacheHitLayer): TranslateLeafWithL1Result {
  return { result, cacheHit };
}

async function translateLeafWithCacheLayers(input: {
  l1Memo?: TranslateCacheL1Port;
  l2Store?: TranslateCacheL2Port;
  provider: Translator;
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  providerId: TranslationProviderId;
  onTranslated?: (sourceText: string, translatedText: string) => Promise<void> | void;
}): Promise<TranslateLeafWithL1Result> {
  if (input.l1Memo !== undefined) {
    const l1Key = buildL1Key({
      l1Memo: input.l1Memo,
      sourceText: input.sourceText,
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      providerId: input.providerId,
    });
    const l1Hit = input.l1Memo.get(l1Key);
    if (l1Hit !== undefined) {
      await input.onTranslated?.(input.sourceText, l1Hit.text);
      return toResult(l1Hit, 'l1');
    }
  }

  if (input.l2Store !== undefined) {
    const l2Key = input.l2Store.buildKey({
      sourceText: input.sourceText,
      sourceLang: input.sourceLang,
      providerId: input.providerId,
    });
    const l2Hit = input.l2Store.get(l2Key);
    if (l2Hit !== undefined) {
      if (input.l1Memo !== undefined) {
        const l1Key = buildL1Key({
          l1Memo: input.l1Memo,
          sourceText: input.sourceText,
          sourceLang: input.sourceLang,
          targetLang: input.targetLang,
          providerId: input.providerId,
        });
        input.l1Memo.set(l1Key, l2Hit);
      }
      await input.onTranslated?.(input.sourceText, l2Hit.text);
      return toResult(l2Hit, 'l2');
    }
  }

  const result = await translateLeaf(input.provider, input.sourceText, input.sourceLang, input.targetLang, {
    providerId: input.providerId,
    onTranslated: input.onTranslated,
  });

  if (input.l1Memo !== undefined) {
    const l1Key = buildL1Key({
      l1Memo: input.l1Memo,
      sourceText: input.sourceText,
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      providerId: input.providerId,
    });
    input.l1Memo.set(l1Key, result);
  }
  if (input.l2Store !== undefined) {
    const l2Key = input.l2Store.buildKey({
      sourceText: input.sourceText,
      sourceLang: input.sourceLang,
      providerId: input.providerId,
    });
    input.l2Store.set(l2Key, result, input.providerId);
  }

  return toResult(result, false);
}

export async function translateLeafWithL1Memo(input: {
  l1Memo?: TranslateCacheL1Port;
  l2Store?: TranslateCacheL2Port;
  provider: Translator;
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  providerId: TranslationProviderId;
  onTranslated?: (sourceText: string, translatedText: string) => Promise<void> | void;
}): Promise<TranslateLeafWithL1Result> {
  return await translateLeafWithCacheLayers(input);
}

/**
 * Translate one leaf with generate L1/L2 caches (lookup order: L1 → L2 → provider).
 *
 * @remarks Only successful provider results are written to cache layers.
 */
export async function translateLeafWithGenerateCache(input: {
  translationCache?: GenerateTranslateCache;
  provider: Translator;
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  providerId: TranslationProviderId;
  onTranslated?: (sourceText: string, translatedText: string) => Promise<void> | void;
}): Promise<TranslateLeafWithL1Result> {
  return await translateLeafWithCacheLayers({
    l1Memo: input.translationCache?.l1,
    l2Store: input.translationCache?.l2,
    provider: input.provider,
    sourceText: input.sourceText,
    sourceLang: input.sourceLang,
    targetLang: input.targetLang,
    providerId: input.providerId,
    onTranslated: input.onTranslated,
  });
}
