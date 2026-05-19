import { languageOftenRtl } from './rtlHint.js';
import type { GenerateLocaleDisplay } from '../../types/generate/localeDisplay.js';
import type { TranslateTargetLanguage } from '../../types/languages/index.js';

/**
 * Resolve English/native labels and layout direction for a generate target.
 *
 * @remarks Pure — catalog + heuristics only; no flags or sidecar files.
 */
export function resolveLocaleDirection(
  targetCode: string,
  catalogDirection?: unknown,
): 'ltr' | 'rtl' {
  if (catalogDirection === 'ltr' || catalogDirection === 'rtl') return catalogDirection;
  return languageOftenRtl(targetCode) ? 'rtl' : 'ltr';
}

/**
 * @param targetCode - BCP-47-ish locale code being generated.
 * @param catalogEntry - Row from `languages.json` when the code is catalog-backed.
 */
export function resolveGenerateLocaleDisplay(
  targetCode: string,
  catalogEntry?: TranslateTargetLanguage,
): GenerateLocaleDisplay {
  return {
    englishName: catalogEntry?.english ?? targetCode,
    nativeName: catalogEntry?.native ?? targetCode,
    direction: resolveLocaleDirection(targetCode, catalogEntry?.direction),
  };
}
