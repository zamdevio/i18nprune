import type { TranslationProviderYield, TranslationResult } from './result.js';

/** HTTP/API backend: one string in, one string out (placeholders handled by `Translator`). */
export type TranslateRequest = {
  text: string;
  sourceLang: string;
  targetLang: string;
};

/** Defaults: 3 tries; delays 400ms / 900ms after 1st and 2nd failure. */
export type TranslatorRetryOptions = {
  maxAttempts: number;
  delaysMs: number[];
};

export type Translator = {
  translate(
    text: string,
    sourceLang: string,
    targetLang: string,
  ): Promise<string | TranslationProviderYield | TranslationResult>;
};

export type * from './policy.js';
export type * from './rateLimit.js';
export type * from './providers.js';
export type * from './result.js';
export type * from './translate.js';
export type * from './cache.js';
export { TRANSLATE_POLICY_DEFAULTS } from './policy.js';
