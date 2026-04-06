/** Flags for `i18nprune generate` (CLI + programmatic API). */
export type GenerateOptions = {
  /** When set, resolved from cwd (programmatic override). */
  source?: string;
  lang?: string;
  /** English UI label in `.meta.json`; default from the languages catalog for `--lang` when omitted. */
  englishName?: string;
  /** Native endonym in `.meta.json`; default from the languages catalog for `--lang` when omitted. */
  nativeName?: string;
  /** Layout direction for consumers (`document.dir`); default `ltr`. */
  direction?: 'ltr' | 'rtl';
  /** Skip `<lang>.meta.json` and meta-related prompts / env (locale JSON only). */
  noMeta?: boolean;
  /** Skip “already complete” prompt and re-translate (also `I18NPRUNE_GENERATE_FORCE`). */
  force?: boolean;
  dryRun?: boolean;
};
