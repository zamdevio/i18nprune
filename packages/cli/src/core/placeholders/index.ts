import type { MaskedText } from '@/types/core/placeholders/index.js';

const SENTINEL_RE = /__I18NPRUNE_(\d+)__/g;

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

/** Restore sentinels after MT. */
export function restore(masked: string, originals: string[]): string {
  return masked.replace(SENTINEL_RE, (_, idx: string) => {
    const i = Number.parseInt(idx, 10);
    const o = originals[i];
    return o !== undefined ? `{{${o}}}` : _;
  });
}

/** @throws if sentinels remain or placeholder multiset differs. */
export function validateRestored(source: string, restored: string, originals: string[]): void {
  if (/__I18NPRUNE_\d+__/.test(restored)) {
    throw new Error('Translation output still contains placeholder sentinels');
  }
  const srcMatches = [...source.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]!.trim());
  if (srcMatches.length !== originals.length) {
    throw new Error('Placeholder count mismatch after translation');
  }
}
