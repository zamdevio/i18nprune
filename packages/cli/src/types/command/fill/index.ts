/** Flags for `i18nprune fill`. */
export type FillOptions = {
  /** Preferred alias for locale targets (single code, comma-separated list, or `all`). */
  target?: string;
  /** Fill all non-source locales under localesDir. */
  all?: boolean;
  /** Skip actual translation and only validate the target locales. */
  dryRun?: boolean;
  /** Skip writing/updating `<lang>.meta.json` */
  noMeta?: boolean;
  /** Interactive TTY: confirm selected target locales before processing. */
  ask?: boolean;
};
