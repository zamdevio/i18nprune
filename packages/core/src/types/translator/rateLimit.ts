import type { TranslationProviderId } from './providers.js';

export type TranslateStartRateLimit = {
  /** Requests per minute ceiling. */
  rpm?: number;
  /** Requests per second ceiling (supports fractions like 0.5). */
  rps?: number;
  /** Hard minimum spacing between request starts. */
  intervalMs?: number;
};

export type ProviderRateLimitProfile = Required<TranslateStartRateLimit> & { maxConcurrency: number };

export type ProviderRateLimitRegistry = Readonly<Record<TranslationProviderId, ProviderRateLimitProfile>>;
