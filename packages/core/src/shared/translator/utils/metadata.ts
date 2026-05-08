import type { TranslationLeafMetaPatch, HeuristicLeafMetaInput } from '../../../types/translator/result.js';

/**
 * Deterministic metadata when the translation backend does not supply scores
 * (or parsing failed — callers may skip provider patch and rely on this only).
 *
 * **Not** a substitute for provider APIs that expose real match/quality scores.
 */
export function buildHeuristicLeafMeta(input: HeuristicLeafMetaInput): TranslationLeafMetaPatch {
  const src = input.sourceText.trim();
  const tgt = input.translatedText.trim();
  const tag = `${input.providerId}-heuristic`;
  if (src.length === 0) {
    return {
      status: 'translated',
      confidence: null,
      needsReview: true,
      source: tag,
      needsTranslationAgain: true,
    };
  }
  if (src === tgt) {
    return {
      status: 'translated',
      confidence: null,
      needsReview: true,
      source: tag,
      needsTranslationAgain: true,
    };
  }
  const ratio = tgt.length / src.length;
  const drift = Math.abs(1 - Math.min(ratio, 2));
  const confidence = Math.max(0.35, Math.min(0.88, 0.62 + (1 - drift) * 0.25));
  return {
    status: 'translated',
    confidence,
    needsReview: confidence < 0.52,
    source: tag,
    needsTranslationAgain: false,
  };
}
