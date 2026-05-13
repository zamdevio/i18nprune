import { I18nPruneError } from '../../errors/index.js';
import type {
  LeafDecision,
  TranslationLeafMeta,
  TranslationLeafMetaPatch,
  TranslationProviderYield,
  TranslationResult,
} from '../../../types/translator/result.js';

// --- BCP 47 (HTTP providers) ---

/** First subtag of a BCP 47 tag (`en-US` → `en`, `zh-Hans` → `zh`). Lowercase. */
export function bcp47PrimarySubtag(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return trimmed;
  const base = trimmed.split(/[-_]/)[0] ?? trimmed;
  return base.toLowerCase();
}

// --- Provider yield → normalized text + optional metadata patch ---

export function unpackProviderTranslation(raw: string | TranslationProviderYield): {
  text: string;
  patch: TranslationLeafMetaPatch;
} {
  if (typeof raw === 'string') return { text: raw, patch: {} };
  return { text: raw.text, patch: raw.leafMeta ?? {} };
}

/** Overlay provider metadata on top of heuristic defaults (`undefined` / missing keys keep heuristic). */
export function mergeTranslationLeafMeta(
  heuristic: TranslationLeafMetaPatch,
  provider: TranslationLeafMetaPatch,
): TranslationLeafMetaPatch {
  return {
    status: provider.status ?? heuristic.status,
    confidence: 'confidence' in provider ? provider.confidence ?? null : heuristic.confidence,
    needsReview: 'needsReview' in provider ? provider.needsReview! : heuristic.needsReview,
    needsTranslationAgain:
      'needsTranslationAgain' in provider ? provider.needsTranslationAgain! : heuristic.needsTranslationAgain,
    source: provider.source ?? heuristic.source,
  };
}

/**
 * Normalize a merged provider+heuristic patch into the fully-populated `TranslationLeafMeta`
 * contract that {@link translateLeaf} returns.
 *
 * **`decision` is the source of truth for `needsReview`.** When `decision === 'review'`,
 * the returned `needsReview` is forced to `true` — the patch's own `needsReview` is
 * ignored in that case. When `decision` is `'translated'` or omitted, `needsReview` falls
 * back to the patch (or `false`).
 *
 * @remarks
 * Step 2 of `translate-policy (shipped)`. Future signals (policy resolver,
 * identity guard, partial-write) compute `decision` from non-heuristic sources and pass
 * it here to update the persisted marker without bypassing the contract.
 *
 * Pure: no I/O, no clock, no host adapters. Confidence is clamped to `[0, 1]` and
 * rounded to two decimals.
 */
export function finalizeTranslationLeafMeta(
  patch: TranslationLeafMetaPatch,
  decision?: LeafDecision,
): TranslationLeafMeta {
  const roundConfidence = (v: number | null | undefined): number | null => {
    if (v === null || v === undefined) return null;
    if (!Number.isFinite(v)) return null;
    const clamped = Math.max(0, Math.min(1, v));
    return Math.round(clamped * 100) / 100;
  };
  return {
    status: patch.status ?? 'translated',
    confidence: roundConfidence(patch.confidence),
    needsReview: decision === 'review' ? true : (patch.needsReview ?? false),
    needsTranslationAgain: patch.needsTranslationAgain ?? false,
    source: patch.source ?? 'manual',
  };
}

// --- Persisted locale JSON shape ---

/** When **`persistStructuredMetadata`** is false, only the translated string is stored. */
export function localeJsonValueFromTranslation(
  persistStructuredMetadata: boolean,
  tr: TranslationResult,
): unknown {
  if (!persistStructuredMetadata) return tr.text;
  return {
    value: tr.text,
    status: tr.leafMeta.status,
    confidence: tr.leafMeta.confidence,
    needsReview: tr.leafMeta.needsReview,
    needsTranslationAgain: tr.leafMeta.needsTranslationAgain,
    source: tr.leafMeta.source,
  };
}

// --- Post-provider contract ---

/**
 * Shared post-provider validation: every backend must yield a **string** suitable for JSON string leaves.
 * Provider-specific checks (e.g. AI JSON shape) happen **before** this or in a wrapper `Translator`.
 */
export function validateLeafTranslationString(value: unknown, context?: string): string {
  if (typeof value !== 'string') {
    throw new I18nPruneError(
      `Translator returned non-string${context ? ` (${context})` : ''}`,
      'INTERNAL',
    );
  }
  return value;
}
