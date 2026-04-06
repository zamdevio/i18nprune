/** Flags for `i18nprune quality` (parity / EN-identical reports). */
export type QualityOptions = {
  /** Report only this locale file (basename without .json); omit for all non-source locales */
  lang?: string;
};
