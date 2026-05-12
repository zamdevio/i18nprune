import { collectTranslationSurfaceLeaves } from '../localeLeaves/translationSurfaceWalk.js';

/** Path → translated string value using the same logical paths as the source locale (`collectTranslationSurfaceLeaves`). */
export function translationSurfacePathValueMap(localeJson: unknown): Map<string, string> {
  const m = new Map<string, string>();
  for (const row of collectTranslationSurfaceLeaves(localeJson)) {
    m.set(row.path, row.value);
  }
  return m;
}
