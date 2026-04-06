/** Flags for `i18nprune fill`. */
export type FillOptions = {
  lang?: string;
  /** Do not call translator or write files */
  dryRun?: boolean;
  /** Skip writing/updating `<lang>.meta.json` */
  noMeta?: boolean;
};
