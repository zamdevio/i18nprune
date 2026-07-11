import type { MaskedText } from '../../types/placeholders/index.js';

/**
 * Sentinel pattern after masking — MT backends may insert spaces or change casing
 * (`__ I18NPRUNE_0 __`, `__I18NPRUNE _0__`, etc.).
 */
const SENTINEL_VARIANT_RE = /__\s*I18NPRUNE[\s_]*(\d+)\s*__/gi;

/** Any residual numeric mask index in translated output (spacing tolerant). */
const SENTINEL_LEAK_RE = /I18NPRUNE[\s_]*\d+/i;

/** Scaffold missing-key sentinel — not an MT mask leak (`__I18NPRUNE_MISSING__`). */
const MISSING_PLACEHOLDER_LEAK_GUARD_RE = /I18NPRUNE[\s_]*MISSING/i;

/** Replace `{{...}}` with sentinels before MT. */
export function mask(input: string): MaskedText {
  const originals: string[] = [];
  const text = input.replace(/\{\{([^}]+)\}\}/g, (_, inner: string) => {
    const i = originals.length;
    originals.push(inner.trim());
    return `__I18NPRUNE_${i}__`;
  });
  return { text, originals };
}

/** Restore sentinels after MT (accepts common provider mangling). */
export function restore(masked: string, originals: string[]): string {
  return masked.replace(SENTINEL_VARIANT_RE, (_, idx: string) => {
    const i = Number.parseInt(idx, 10);
    const o = originals[i];
    return o !== undefined ? `{{${o}}}` : _;
  });
}

/** True when translated text still contains an i18nprune numeric mask sentinel (not missing scaffold). */
export function containsPlaceholderSentinelLeak(text: string): boolean {
  if (!SENTINEL_LEAK_RE.test(text)) return false;
  if (MISSING_PLACEHOLDER_LEAK_GUARD_RE.test(text)) {
    const withoutMissing = text.replace(MISSING_PLACEHOLDER_LEAK_GUARD_RE, '');
    return SENTINEL_LEAK_RE.test(withoutMissing);
  }
  return true;
}

/**
 * Leaf whose non-placeholder content is only punctuation / separators
 * (e.g. `{{who}} · {{status}}`).
 */
export function isPlaceholderOnlyLeaf(value: string): boolean {
  if (!/\{\{[^}]+\}\}/.test(value)) return false;
  const remainder = value.replace(/\{\{[^}]+\}\}/g, '');
  return remainder === '' || /^[\s\p{P}\p{S}]*$/u.test(remainder);
}

/** @throws if sentinels remain or placeholder multiset differs. */
export function validateRestored(source: string, restored: string, originals: string[]): void {
  if (containsPlaceholderSentinelLeak(restored)) {
    throw new Error('Translation output still contains placeholder sentinels');
  }
  const srcMatches = [...source.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]!.trim());
  if (srcMatches.length !== originals.length) {
    throw new Error('Placeholder count mismatch after translation');
  }
}
