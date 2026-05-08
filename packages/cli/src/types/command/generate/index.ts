/** Flags for `i18nprune generate` (CLI + programmatic API). */
export type GenerateOptions = {
  /** Optional `--provider` override; full precedence is `resolveTranslationProviderOptions` (flag → env → `translate` in config). */
  provider?: string;
  /** Max parallel **`translateLeaf`** calls (overrides env and **`translate.workers`**). */
  workers?: number;
  /** When set, resolved from cwd (programmatic override). */
  source?: string;
  /** Preferred alias for locale targets (single code or comma-separated list). */
  target?: string;
  /** English UI label in `.meta.json`; default from the languages catalog for `--target` when omitted. */
  englishName?: string;
  /** Native endonym in `.meta.json`; default from the languages catalog for `--target` when omitted. */
  nativeName?: string;
  /** Layout direction for consumers (`document.dir`); default `ltr`. */
  direction?: 'ltr' | 'rtl';
  /** Skip “already complete” prompt and re-translate (also `I18NPRUNE_GENERATE_FORCE`). */
  force?: boolean;
  /** Skip actual translation and only validate the target locales. */
  dryRun?: boolean;
  /** Write/repair structured locale leaves (`{ value, status, confidence, needsReview, source }`). */
  metadata?: boolean;
  /** Skip writing **`<lang>.meta.json`** (merged with **`config.noLocaleMeta`**; either **`true`** skips). */
  noLocaleMeta?: boolean;
};
