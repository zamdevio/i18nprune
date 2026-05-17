import type { LocaleSegmentSource } from './segmentSource.js';

/**
 * Canonical **translation surface** for locale JSON: one row per logical key path
 * (legacy string terminals or structured `{ value, … }` objects — same path layout as the source locale).
 */
export type TranslationSurfaceShape = 'legacy_string' | 'structured';

export type TranslationSurfaceLeaf = {
  path: string;
  value: string;
  shape: TranslationSurfaceShape;
  status?: string;
  confidence: number | null;
  needsReview: boolean | null;
  needsTranslationAgain?: boolean | null;
  /** Structured-locale JSON `source` field (`manual`, provider id, …) — written to disk; not segment provenance. */
  catalogSource?: string;
  /** In-memory segment provenance for multi-file layouts; never persisted as this object. */
  source?: LocaleSegmentSource;
  structuredMetaComplete?: boolean;
};
