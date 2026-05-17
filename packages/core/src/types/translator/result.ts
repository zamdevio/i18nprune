import type { StructuredLocaleLeaf } from '../locales/leaves/index.js';
import type { TranslationProviderId } from './providers.js';

/**
 * Optional per-leaf fields merged into a structured locale leaf (`{ value, … }`).
 * `value` always comes from {@link TranslationResult.text}; this patch is everything else.
 */
export type TranslationLeafMetaPatch = Partial<
  Pick<
    StructuredLocaleLeaf,
    'status' | 'confidence' | 'needsReview' | 'needsTranslationAgain' | 'source'
  >
>;

/**
 * Rich provider response (before heuristic merge). `leafMeta` may be partial or omitted.
 */
export type TranslationProviderYield = {
  readonly text: string;
  readonly leafMeta?: TranslationLeafMetaPatch;
};

/**
 * Final per-leaf metadata after provider + heuristic merge (`translateLeaf`).
 * All fields are always set so hosts can rely on them without optional chaining.
 */
export type TranslationLeafMeta = {
  status: string;
  confidence: number | null;
  needsReview: boolean;
  needsTranslationAgain: boolean;
  source: string;
};

/**
 * Post-translation routing signal for a single leaf.
 *
 * - `'translated'` — leaf is final; downstream consumers treat it as done.
 * - `'review'` — leaf needs human or workflow attention before it can be considered
 *   complete. The persisted marker is `needsReview: true` on the structured leaf
 *   (no separate key — see `translate-policy (shipped)` §5).
 *
 * The decision is the source of truth; the structured-leaf `needsReview` flag mirrors it.
 * `finalizeTranslationLeafMeta` enforces the mirror.
 */
export type LeafDecision = 'translated' | 'review';

/**
 * Output of {@link translateLeaf}: final string plus **merged** metadata (provider + heuristic).
 * **`leafMeta`** is always fully populated. The CLI only **persists** structured locale JSON when the
 * user passes **`--metadata`**; core does not strip metadata based on that flag.
 */
export type TranslationResult = {
  readonly text: string;
  readonly leafMeta: TranslationLeafMeta;
  /** Optional policy decision; `review` promotes attention workflows downstream. */
  readonly decision?: LeafDecision;
  /** Runtime-only transport stats (not persisted to locale JSON). */
  readonly runtime?: {
    attempts: number;
    retries: number;
  };
};

/** Context for heuristic metadata when a provider returns no scores. */
export type HeuristicLeafMetaInput = {
  readonly sourceText: string;
  readonly translatedText: string;
  readonly providerId: TranslationProviderId;
};
