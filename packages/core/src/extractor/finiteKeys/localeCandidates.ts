import { FINITE_KEYS_LOCALE_CANDIDATE_CAP } from '../../shared/constants/extractor.js';
import { pathUnderUncertainPrefix } from '../../shared/reference/paths.js';
import type { CandidateKey } from '../../types/extractor/finiteKeys/index.js';
import type { TranslationSurfaceLeaf } from '../../types/locales/leaves/translationSurface.js';

export type LocaleInferredCandidatesResult = {
  candidates: CandidateKey[];
  truncated: boolean;
};

/**
 * Walk source-locale leaves under `prefix` and emit locale_inferred candidates.
 * Deterministic sort; capped at {@link FINITE_KEYS_LOCALE_CANDIDATE_CAP}.
 * Never promotes to provenKeys.
 *
 * @sdkTier stable
 */
export function collectLocaleInferredCandidates(
  prefix: string,
  leaves: readonly TranslationSurfaceLeaf[],
  cap: number = FINITE_KEYS_LOCALE_CANDIDATE_CAP,
): LocaleInferredCandidatesResult {
  const normalized = prefix.trim();
  if (!normalized) return { candidates: [], truncated: false };

  const matched: string[] = [];
  for (const leaf of leaves) {
    if (pathUnderUncertainPrefix(leaf.path, normalized)) {
      matched.push(leaf.path);
    }
  }
  matched.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const truncated = matched.length > cap;
  const slice = truncated ? matched.slice(0, cap) : matched;
  return {
    candidates: slice.map((key) => ({ key, confidence: 'locale_inferred' as const })),
    truncated,
  };
}
