import type { Issue } from '../json/envelope/index.js';
import type { TranslationProviderId } from '../translator/providers.js';
import type { ProviderRateLimitProfile, TranslateStartRateLimit } from '../translator/rateLimit.js';

export type TranslateRateLimitConfigInput = {
  maxConcurrency?: number;
  rpm?: number;
  rps?: number;
  intervalMs?: number;
};

type TranslateProviderRowInputBase = {
  enabled?: boolean;
  rateLimit?: TranslateRateLimitConfigInput;
};

export type TranslateProviderRowInputGoogle = TranslateProviderRowInputBase & { id: 'google' };
export type TranslateProviderRowInputMymemory = TranslateProviderRowInputBase & {
  id: 'mymemory';
  contactEmail?: string;
};
export type TranslateProviderRowInputLibre = TranslateProviderRowInputBase & {
  id: 'libre';
  baseUrl?: string;
};
export type TranslateProviderRowInputDeepl = TranslateProviderRowInputBase & {
  id: 'deepl';
  apiKey?: string;
};
export type TranslateProviderRowInputLlm = TranslateProviderRowInputBase & {
  id: 'llm';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
};

export type TranslateProviderRowInput =
  | TranslateProviderRowInputGoogle
  | TranslateProviderRowInputMymemory
  | TranslateProviderRowInputLibre
  | TranslateProviderRowInputDeepl
  | TranslateProviderRowInputLlm;

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
