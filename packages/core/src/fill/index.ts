/**
 * **Fill** engine — eligibility guards and translation walk over review leaves.
 * Subpath: `@i18nprune/core/fill` (see package `exports`). Root `@i18nprune/core` also re-exports.
 */
export { isFillCandidateLeaf } from './eligibleLeaves.js';
export { leafMatchesSourceForFill } from './leafMatchesSourceForFill.js';
export { translateFillCandidateLeaves } from './translateCandidateLeaves.js';
