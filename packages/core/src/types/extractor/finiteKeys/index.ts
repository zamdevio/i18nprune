/**
 * Finite-key candidate expansion (locale-assisted / typed).
 * Candidates are never promoted to provenKeys without an explicit policy change.
 */

export type CandidateKeyConfidence = 'locale_inferred' | 'type_inferred';

export type CandidateKey = {
  key: string;
  confidence: CandidateKeyConfidence;
};
