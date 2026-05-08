/** Counts `__I18NPRUNE_*` mask tokens present in a string (used to detect LLM stripping). */
export function countI18nPrunePlaceholderTokens(s: string): number {
  const m = s.match(/__I18NPRUNE_[A-Z]+_\d+__/g);
  return m?.length ?? 0;
}

/** Throws when the model returned fewer mask tokens than the input (corrupted placeholder restore). */
export function assertLlmOutputPreservesPlaceholders(maskedSource: string, translated: string): void {
  const expected = countI18nPrunePlaceholderTokens(maskedSource);
  const actual = countI18nPrunePlaceholderTokens(translated);
  if (actual < expected) {
    throw new Error(
      `LLM output dropped one or more __I18NPRUNE_* placeholder tokens (${String(actual)}/${String(expected)}); refusing corrupted translation`,
    );
  }
}
