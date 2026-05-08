/**
 * **Fill** operation — types shared with `@i18nprune/core`.
 * CLI-facing option types stay in the CLI package (`types/command/fill`).
 */
import type { ReviewLeafRow } from '../../review/collectReviewLeaves.js';
import type { ParityPolicy, PreservePolicy } from '../policies/index.js';
import type { EffectiveReferenceConfig } from '../reference/index.js';

/** Subset of key-reference context used for fill guard logic. */
export type FillEligibilityRefContext = {
  uncertainPrefixes: readonly string[];
};

/** Inputs for {@link import('../../fill/eligibleLeaves.js').isFillCandidateLeaf}. */
export type FillCandidateLeafInput = {
  leaf: ReviewLeafRow;
  sourceMap: ReadonlyMap<string, string>;
  refCtx: FillEligibilityRefContext;
  eff: EffectiveReferenceConfig;
  preserve?: PreservePolicy;
  parity?: ParityPolicy;
};
