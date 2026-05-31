import { collectTranslationSurfaceLeaves } from '../locales/leaves/index.js';
import type { TranslationSurfaceLeaf } from '../../types/locales/leaves/translationSurface.js';

/** Path → translated string value from {@link TranslationSurfaceLeaf} rows. */
export function translationSurfacePathValueMapFromLeaves(
  leaves: readonly Pick<TranslationSurfaceLeaf, 'path' | 'value'>[],
): Map<string, string> {
  return new Map(leaves.map((row) => [row.path, row.value]));
}

/** Path → translated string value by walking locale JSON (prefer cached leaves when available). */
export function translationSurfacePathValueMap(localeJson: unknown): Map<string, string> {
  const m = new Map<string, string>();
  for (const row of collectTranslationSurfaceLeaves(localeJson)) {
    m.set(row.path, row.value);
  }
  return m;
}
