export { IdentityAbortError } from './error.js';
export { buildIdentityStreakIssue } from './issue.js';
export {
  IDENTITY_STREAK_THRESHOLD,
  isIdentityTranslation,
  nextIdentityStreakState,
  type IdentitySample,
  type IdentityStreakState,
} from './state.js';
export {
  createIdentityStreakGuard,
  IDENTITY_STREAK_SAMPLE_MAX,
  type IdentityStreakConfirmFn,
  type IdentityStreakConfirmInput,
  type IdentityStreakGuard,
  type IdentityStreakGuardOptions,
  type IdentityStreakInteractive,
} from './guard.js';
