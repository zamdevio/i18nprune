import { mask } from '../../shared/placeholders/index.js';
import { computeCacheContentHash } from '../../cache/io/hash.js';
import type { BuildTranslateCacheKeyForLocaleFileInput, BuildTranslateCacheKeyInput } from '../../types/translator/cache.js';

function digestParts(parts: string[]): string {
  return computeCacheContentHash(parts.join('\0'));
}

/** Text-level cache identity for L1 (includes target language in digest). */
export function buildTranslateCacheKey(input: BuildTranslateCacheKeyInput): string {
  const { text } = mask(input.sourceText);
  return digestParts([
    input.translateConfigEpoch,
    input.providerId,
    input.sourceLang,
    input.targetLang,
    text,
  ]);
}

/** Per-locale file identity — target lang is implied by `translations/<code>.json`. */
export function buildTranslateCacheKeyForLocaleFile(input: BuildTranslateCacheKeyForLocaleFileInput): string {
  const { text } = mask(input.sourceText);
  return digestParts([input.translateConfigEpoch, input.providerId, input.sourceLang, text]);
}
