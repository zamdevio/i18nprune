export { IdentityAbortError } from './error.js';
export { buildIdentityStreakIssue } from './issue.js';
export {
  IDENTITY_STREAK_THRESHOLD,
  isIdentityTranslation,
  nextIdentityStreakState,
} from './state.js';
export type { IdentitySample, IdentityStreakState } from '../../types/translator/identityStreak.js';
export { createIdentityStreakGuard, IDENTITY_STREAK_SAMPLE_MAX } from './guard.js';
export type {
  IdentityStreakConfirmFn,
  IdentityStreakConfirmInput,
  IdentityStreakGuard,
  IdentityStreakGuardOptions,
  IdentityStreakInteractive,
} from '../../types/translator/identityStreak.js';
