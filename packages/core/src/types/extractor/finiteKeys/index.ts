/**
 * Finite-key candidate expansion (locale-assisted / typed).
 * Candidates are never promoted to provenKeys without an explicit policy change.
 */

/** @sdkTier stable */
export type CandidateKeyConfidence = 'locale_inferred' | 'type_inferred';

/** @sdkTier stable */
export type CandidateKey = {
  key: string;
  confidence: CandidateKeyConfidence;
};
