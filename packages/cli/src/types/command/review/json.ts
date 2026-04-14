/** Options for `review --json` / `runReview`. */
export type ReviewJsonOpts = {
  target?: string;
  top?: number;
  full?: boolean;
};

/** Payload inside `CliJsonEnvelope<'review', …>`. */
export type ReviewJsonData = {
  kind: 'localeReview';
  sourceLocale: string;
  localesDir: string;
  dynamicKeySites: number;
  locales: Record<string, { stringPaths: number; englishIdentical: number }>;
};
