/**
 * Types for **`generate --resume`** (review-leaf top-up); shared with resume translation helpers.
 */
import type { ReviewLeafRow } from '../localeLeaves/index.js';
import type { ParityPolicy, PreservePolicy } from '../policies/index.js';
import type { EffectiveReferenceConfig } from '../reference/index.js';

/** Subset of key-reference context used for resume eligibility guards. */
export type GenerateResumeRefContext = {
  uncertainPrefixes: readonly string[];
};

/** Inputs for {@link import('../../generate/resume/eligibleResumeLeaves.js').isResumeCandidateLeaf}. */
export type GenerateResumeCandidateLeafInput = {
  leaf: ReviewLeafRow;
  sourceMap: ReadonlyMap<string, string>;
  refCtx: GenerateResumeRefContext;
  eff: EffectiveReferenceConfig;
  preserve?: PreservePolicy;
  parity?: ParityPolicy;
};
