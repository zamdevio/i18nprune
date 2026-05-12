import { leafMatchesSourceForResume } from './leafMatchesSourceForResume.js';
import { isParityExcluded } from '../../policies/parity.js';
import { isPreservePath } from '../../policies/preserve.js';
import { pathUnderAnyUncertainPrefix } from '../../shared/reference/paths.js';
import type { GenerateResumeCandidateLeafInput } from '../../types/generate/resumeCandidates.js';

/**
 * When structured metadata is complete:
 * - **`needsTranslationAgain`** → always candidate (explicit re-queue).
 * - Else **similarity / stale** via {@link leafMatchesSourceForResume} (strict + trim / case-fold).
 */
function isResumeCandidateStructuredMeta(input: GenerateResumeCandidateLeafInput): boolean {
  const { leaf, sourceMap } = input;
  const srcVal = sourceMap.get(leaf.path);
  if (srcVal === undefined) return false;
  if (leaf.needsTranslationAgain === true) return true;
  return leafMatchesSourceForResume(leaf.value, srcVal);
}

/**
 * Whether this leaf would be considered for **`generate --resume`** (same guards as the legacy fill
 * command before removal).
 */
export function isResumeCandidateLeaf(input: GenerateResumeCandidateLeafInput): boolean {
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
    return isResumeCandidateStructuredMeta(input);
  }
  return leafMatchesSourceForResume(leaf.value, srcVal);
}
