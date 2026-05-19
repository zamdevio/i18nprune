/** Display metadata for a generate target, resolved from the bundled language catalog. */
export type GenerateLocaleDisplay = {
  /** English label from catalog (falls back to target code). */
  englishName: string;
  /** Native endonym from catalog (falls back to target code). */
  nativeName: string;
  /** Layout direction from catalog or RTL heuristic. */
  direction: 'ltr' | 'rtl';
};
