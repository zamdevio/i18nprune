import type { Issue } from '../json/envelope/index.js';
import type { TranslationProviderId } from '../translator/providers.js';
import type { ProviderRateLimitProfile, TranslateStartRateLimit } from '../translator/rateLimit.js';

export type TranslateRateLimitConfigInput = {
  maxConcurrency?: number;
  rpm?: number;
  rps?: number;
  intervalMs?: number;
};

export type TranslateProviderRowInput = {
  id: TranslationProviderId;
  enabled?: boolean;
  rateLimit?: TranslateRateLimitConfigInput;
};

export type TranslatePolicyConfigInput = {
  routing?: 'single' | 'auto';
};

export type TranslateConfigInput = {
  primary?: TranslationProviderId;
  providers?: TranslateProviderRowInput[];
  policy?: TranslatePolicyConfigInput;
  workers?: number;
};

export type ResolvedTranslateProviderRow = {
  id: TranslationProviderId;
  profile: ProviderRateLimitProfile;
  startRateLimit?: TranslateStartRateLimit;
};

export type ResolvedTranslateConfig = {
  providerOrder: TranslationProviderId[];
  effectiveProviderId: TranslationProviderId;
  requestedWorkers: number;
  effectiveWorkers: number;
  providers: Record<TranslationProviderId, ResolvedTranslateProviderRow>;
  routing: 'single' | 'auto';
};

export type ResolveTranslateWarning = Issue;
