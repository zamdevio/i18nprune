import { normalizeLanguageCode } from './normalize.js';

/**
 * Basenames (before `-`) that are **typically** RTL in UI tooling. Not exhaustive — used for
 * **warn-only** hints when catalog direction may disagree with common practice.
 */
const TYPICAL_RTL_LANGUAGE_BASES = new Set([
  'ar',
  'arc',
  'ckb',
  'dv',
  'fa',
  'ff',
  'ha',
  'he',
  'khw',
  'ks',
  'ps',
  'sd',
  'ug',
  'ur',
  'yi',
]);

/** Whether the language code is **often** RTL in product UIs (heuristic; warn-only). */
export function languageOftenRtl(code: string): boolean {
  const base = normalizeLanguageCode(code).split('-')[0] ?? '';
  return TYPICAL_RTL_LANGUAGE_BASES.has(base);
}
