/** Options for `review --json` / `runReview`. */
export type ReviewJsonOpts = {
  /** Comma-separated locale basenames, or `all` / omit for every non-source file. */
  target?: string;
};

/** Per-locale aggregates (plain strings + optional structured `{ value, status, … }` leaves). */
export type ReviewLocaleStats = {
  stringPaths: number;
  englishIdentical: number;
  legacyLeaves: number;
  structuredLeaves: number;
  needsReviewTrue: number;
  needsReviewFalse: number;
  needsReviewUnset: number;
  /** Structured `{ value, … }` leaves where `needsReview` is missing, non-boolean, or absent. */
  structuredLeavesMissingNeedsReview: number;
  /** Structured leaves where `confidence` is missing, non-finite, or JSON `null`. */
  structuredLeavesMissingConfidence: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  confidenceBuckets: { none: number; low: number; mid: number; high: number };
};

/** Payload inside `CliJsonEnvelope<'review', …>`. */
export type ReviewJsonData = {
  kind: 'localeReview';
  sourceLocale: string;
  localesDir: string;
  dynamicKeySites: number;
  locales: Record<string, ReviewLocaleStats>;
};
