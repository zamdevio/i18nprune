import type { CacheWarning } from '../cache/index.js';
import type { TranslationProviderId } from './providers.js';
import type { LeafDecision, TranslationLeafMeta, TranslationResult } from './result.js';

/** Inputs for {@link buildTranslateCacheKey} (L1; includes target language in digest). */
export type BuildTranslateCacheKeyInput = {
  sourceText: string;
  sourceLang: string;
  targetLang: string;
  providerId: TranslationProviderId;
  translateConfigEpoch: string;
};

/** Inputs for per-locale L2 file keys (target language is the file name). */
export type BuildTranslateCacheKeyForLocaleFileInput = {
  sourceText: string;
  sourceLang: string;
  providerId: TranslationProviderId;
  translateConfigEpoch: string;
};

/** One persisted L2 translation row (text-level; no leaf path). */
export type TranslationCacheEntry = {
  text: string;
  leafMeta: TranslationLeafMeta;
  decision?: LeafDecision;
  providerId: TranslationProviderId;
  createdAt: string;
};

/** On-disk `translations/<code>.json` envelope (target lang is the file name). */
export type TranslationLocaleCacheFile = {
  version: number;
  updatedAt: string;
  targetLang: string;
  translateConfigEpoch: string;
  inputFilesEpoch: string;
  entries: Record<string, TranslationCacheEntry>;
};

export type TranslateCacheHitLayer = false | 'l1' | 'l2';

export type TranslateLeafWithL1Result = {
  result: TranslationResult;
  cacheHit: TranslateCacheHitLayer;
};

/** In-process L1 memo surface used by {@link translateLeafWithGenerateCache}. */
export type TranslateCacheL1Port = {
  readonly translateConfigEpoch: string;
  get(key: string): TranslationResult | undefined;
  set(key: string, value: TranslationResult): void;
  buildKey(input: {
    sourceText: string;
    sourceLang: string;
    targetLang: string;
    providerId: TranslationProviderId;
  }): string;
};

/** Per-target L2 disk store surface (`translations/<code>.json`). */
export type TranslateCacheL2Port = {
  readonly targetLang: string;
  get(key: string): TranslationResult | undefined;
  set(key: string, result: TranslationResult, providerId: TranslationProviderId): void;
  buildKey(input: {
    sourceText: string;
    sourceLang: string;
    providerId: TranslationProviderId;
  }): string;
  flush(): CacheWarning | undefined;
};

/** Per-run L1 memo plus optional per-target L2 store for generate. */
export type GenerateTranslateCache = {
  l1?: TranslateCacheL1Port;
  l2?: TranslateCacheL2Port;
};

/** L1-only slice shared across targets until L2 is bound per locale. */
export type GenerateTranslateCacheBase = {
  l1?: TranslateCacheL1Port;
};

/** Options for {@link openTranslateCacheL2ForTarget}. */
export type OpenTranslateCacheL2Options = {
  /** When true, skip L2 reads (e.g. `generate --force`). */
  bypassL2?: boolean;
};
