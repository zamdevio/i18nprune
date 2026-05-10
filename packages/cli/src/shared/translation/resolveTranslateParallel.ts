/**
 * Thin CLI shims over the core translator parallelism resolvers. The CLI passes **`process.env`**;
 * core does the math.
 */

import {
  buildTranslateParallelLimitSuggestion as buildCoreSuggestion,
  resolveProviderRateLimitProfile,
  resolveTranslateMaxParallelEffective as resolveCoreMaxParallelEffective,
  resolveTranslateMaxParallelFromConfig,
  resolveTranslateRateLimitEffective as resolveCoreTranslateRateLimitEffective,
} from '@i18nprune/core';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import type {
  ProviderRateLimitProfile,
  TranslateStartRateLimit,
  TranslationProviderId,
} from '@i18nprune/core';

/** Resolve max parallel **`translateLeaf`** calls for **`generate`** / **`fill`** (config + env + CLI). */
export function resolveCliTranslateMaxParallel(input: {
  config: I18nPruneConfig;
  workers?: number;
}): number {
  return resolveTranslateMaxParallelFromConfig({
    config: input.config.translate,
    workers: input.workers,
    env: process.env,
  });
}

export function resolveCliProviderRateLimitProfile(input: {
  config: I18nPruneConfig;
  providerId: TranslationProviderId;
}): ProviderRateLimitProfile {
  return resolveProviderRateLimitProfile({
    config: input.config.translate,
    providerId: input.providerId,
  });
}

export function resolveCliTranslateMaxParallelEffective(input: {
  config: I18nPruneConfig;
  workers?: number;
  providerId: TranslationProviderId;
}): number {
  return resolveCoreMaxParallelEffective({
    config: input.config.translate,
    workers: input.workers,
    providerId: input.providerId,
    env: process.env,
  });
}

export function resolveCliTranslateRateLimitEffective(input: {
  config: I18nPruneConfig;
  providerId: TranslationProviderId;
}): TranslateStartRateLimit | undefined {
  return resolveCoreTranslateRateLimitEffective({
    config: input.config.translate,
    providerId: input.providerId,
  });
}

export function buildTranslateParallelLimitSuggestion(input: {
  config: I18nPruneConfig;
  workers?: number;
  providerId: TranslationProviderId;
}): string | undefined {
  return buildCoreSuggestion({
    config: input.config.translate,
    workers: input.workers,
    providerId: input.providerId,
    env: process.env,
  });
}
