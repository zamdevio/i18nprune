import type { LocaleLeafFileOrigin } from './fileOrigin.js';

/**
 * Canonical **translation surface** for locale JSON: one row per logical key path
 * (legacy string terminals or structured `{ value, … }` objects — same path layout as the source locale).
 */
export type TranslationSurfaceShape = 'legacy_string' | 'structured';

/** @alias {@link TranslationSurfaceLeaf} — kept for existing imports / issue copy. */
export type ReviewLeafShape = TranslationSurfaceShape;

export type TranslationSurfaceLeaf = {
  path: string;
  value: string;
  shape: TranslationSurfaceShape;
  /** Present when `shape === 'structured'` and the field exists. */
  status?: string;
  confidence: number | null;
  needsReview: boolean | null;
  /** Present when `shape === 'structured'` and the field exists. */
  needsTranslationAgain?: boolean | null;
  /** Structured-locale JSON field: upstream / catalog reference — not on-disk file provenance. */
  source?: string;
  /** Optional segment file that produced this row; omitted when unknown or not applicable. */
  fileOrigin?: LocaleLeafFileOrigin;
  /**
   * When `shape === 'structured'`, true iff the JSON node has every canonical metadata field
   * with valid types (see {@link isCompleteStructuredLocaleLeafMeta}).
   */
  structuredMetaComplete?: boolean;
};

/** @alias {@link TranslationSurfaceLeaf} — kept for review / resume typings. */
export type ReviewLeafRow = TranslationSurfaceLeaf;
