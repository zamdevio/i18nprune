import { leafMatchesSourceForFill } from './leafMatchesSourceForFill.js';
import { isParityExcluded } from '../policies/parity.js';
import { isPreservePath } from '../policies/preserve.js';
import { pathUnderAnyUncertainPrefix } from '../shared/reference/paths.js';
import type { FillCandidateLeafInput } from '../types/fill/index.js';

/**
 * When structured metadata is complete:
 * - **`needsTranslationAgain`** → always candidate (explicit re-queue).
 * - Else **similarity / stale** via {@link leafMatchesSourceForFill} (strict + trim / case-fold).
 *   Confidence is surfaced on **`ReviewLeafRow`** for ranking / **`review`**; it does not block obvious stale copies.
 */
function isFillCandidateStructuredMeta(input: FillCandidateLeafInput): boolean {
  const { leaf, sourceMap } = input;
  const srcVal = sourceMap.get(leaf.path);
  if (srcVal === undefined) return false;
  if (leaf.needsTranslationAgain === true) return true;
  return leafMatchesSourceForFill(leaf.value, srcVal);
}

/**
 * Whether this leaf would be considered for fill (same guards as `fillOneLocale` before translation).
 *
 * - **Legacy string** or **structured with incomplete meta:** candidate when **`leafMatchesSourceForFill`**
 *   (strict + trimmed / case-insensitive).
 * - **Structured with complete meta:** **`needsTranslationAgain`**, or **stale** match via
 *   {@link leafMatchesSourceForFill}.
 */
export function isFillCandidateLeaf(input: FillCandidateLeafInput): boolean {
  const { leaf, sourceMap, refCtx, eff, preserve, parity } = input;
  const srcVal = sourceMap.get(leaf.path);
  if (srcVal === undefined) return false;
  if (eff.respectPreserve && isPreservePath(leaf.path, preserve)) return false;
  if (eff.uncertainKeyPolicy === 'protect' || eff.uncertainKeyPolicy === 'warn_only') {
    if (pathUnderAnyUncertainPrefix(leaf.path, refCtx.uncertainPrefixes)) return false;
  }
  if (isParityExcluded(leaf.path, leaf.value, parity)) return false;

  const useMeta = leaf.shape === 'structured' && leaf.structuredMetaComplete === true;
  if (useMeta) {
    return isFillCandidateStructuredMeta(input);
  }
  return leafMatchesSourceForFill(leaf.value, srcVal);
}
