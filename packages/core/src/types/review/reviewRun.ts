import type { Issue } from '../json/envelope/index.js';
import type { RunEmitter } from '../shared/run/index.js';

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

/** Options for the review operation. */
export type ReviewRunOptions = {
  /** Comma-separated locale basenames, or `all` / omit for every non-source file. */
  target?: string;
};

/** Payload returned by `runReview`; CLI wraps this in its stable JSON envelope. */
export type ReviewJsonData = {
  kind: 'localeReview';
  sourceLocale: string;
  localesDir: string;
  dynamicKeySites: number;
  locales: Record<string, ReviewLocaleStats>;
};

export type ReviewHostHooks = {
  emit?: RunEmitter;
  runId?: string;
  /** Dynamic translation call-site count used for JSON/human warnings. */
  getDynamicSitesCount: () => number;
};

export type ReviewRunResult = {
  payload: ReviewJsonData;
  issues: Issue[];
};
