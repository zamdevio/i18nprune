/** Flags for `i18nprune cleanup`. */
export type CleanupOptions = {
  checkOnly?: boolean;
  /** Do not run ripgrep safety (delete purely from static key analysis; use with care) */
  skipRg?: boolean;
};
