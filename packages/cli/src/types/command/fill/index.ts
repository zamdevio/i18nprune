/** Flags for `i18nprune fill`. */
export type FillOptions = {
  /** Optional `--provider` override; full precedence is `resolveTranslationProviderOptions` (flag → env → `translate` in config). */
  provider?: string;
  /** Max parallel **`translateLeaf`** calls (overrides env and **`translate.workers`**). */
  workers?: number;
  /** Preferred alias for locale targets (single code, comma-separated list, or `all`). */
  target?: string;
  /** Fill all non-source locales under localesDir. */
  all?: boolean;
  /** Skip actual translation and only validate the target locales. */
  dryRun?: boolean;
  /** Write/repair structured locale leaves (`{ value, status, confidence, needsReview, source }`). */
  metadata?: boolean;
  /** Skip writing **`<lang>.meta.json`** (merged with **`config.noLocaleMeta`**; either **`true`** skips). */
  noLocaleMeta?: boolean;
  /** Interactive TTY: confirm selected target locales before processing. */
  ask?: boolean;
};
