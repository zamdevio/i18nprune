import {
  DEFAULT_PROVIDER_RATE_LIMITS,
  resolveTranslateMaxParallel,
} from '@i18nprune/core';
import { ENV_I18NPRUNE_TRANSLATE_MAX_WORKERS } from '@/constants/env.js';
import type { I18nPruneConfig } from '@i18nprune/core/config';
import type {
  TranslationProviderId,
  ProviderRateLimitProfile as EffectiveProviderRateLimitProfile,
  TranslateStartRateLimit as EffectiveTranslateRateLimit,
} from '@i18nprune/core';

/** Resolve max parallel **`translateLeaf`** calls for **`generate`** / **`fill`** (config + env + CLI). */
export function resolveCliTranslateMaxParallel(input: {
  config: I18nPruneConfig;
  workers?: number;
}): number {
  return resolveTranslateMaxParallel({
    configMaxWorkers: input.config.translate?.workers,
    workersFlag: input.workers,
    envMaxWorkers: process.env[ENV_I18NPRUNE_TRANSLATE_MAX_WORKERS],
  });
}

function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, Math.trunc(n)));
}

/** Effective provider defaults + config merge (provider row overrides provider baseline). */
export function resolveCliProviderRateLimitProfile(input: {
  config: I18nPruneConfig;
  providerId: TranslationProviderId;
}): EffectiveProviderRateLimitProfile {
  const defaults = DEFAULT_PROVIDER_RATE_LIMITS[input.providerId];
  const t = input.config.translate;
  const row = t?.providers?.find((p) => p.id === input.providerId && p.enabled !== false)?.rateLimit;
  return {
    maxConcurrency: clampInt(row?.maxConcurrency ?? defaults.maxConcurrency, 1, 64),
    rpm: row?.rpm ?? defaults.rpm,
    rps: row?.rps ?? defaults.rps,
    intervalMs: row?.intervalMs ?? defaults.intervalMs,
  };
}

/**
 * Effective parallelism = min(requested workers, provider effective maxConcurrency).
 */
export function resolveCliTranslateMaxParallelEffective(input: {
  config: I18nPruneConfig;
  workers?: number;
  providerId: TranslationProviderId;
}): number {
  const base = resolveCliTranslateMaxParallel({ config: input.config, workers: input.workers });
  const profile = resolveCliProviderRateLimitProfile({ config: input.config, providerId: input.providerId });
  return clampInt(Math.min(base, profile.maxConcurrency), 1, 64);
}

/**
 * Effective per-provider timing limits.
 * Merge rule: provider row overrides provider defaults for each key.
 */
export function resolveCliTranslateRateLimitEffective(input: {
  config: I18nPruneConfig;
  providerId: TranslationProviderId;
}): EffectiveTranslateRateLimit | undefined {
  const p = resolveCliProviderRateLimitProfile(input);
  const rpm = p.rpm;
  const rps = p.rps;
  const intervalMs = p.intervalMs;
  if (rpm === undefined && rps === undefined && intervalMs === undefined) return undefined;
  return { rpm, rps, intervalMs };
}

export function buildTranslateParallelLimitSuggestion(input: {
  config: I18nPruneConfig;
  workers?: number;
  providerId: TranslationProviderId;
}): string | undefined {
  const base = resolveCliTranslateMaxParallel({ config: input.config, workers: input.workers });
  const effective = resolveCliTranslateMaxParallelEffective(input);
  if (effective >= base) return undefined;
  const profile = resolveCliProviderRateLimitProfile({
    config: input.config,
    providerId: input.providerId,
  });
  const providerDefaults = DEFAULT_PROVIDER_RATE_LIMITS[input.providerId];
  const rowCap = input.config.translate?.providers?.find((p) => p.id === input.providerId && p.enabled !== false)?.rateLimit
    ?.maxConcurrency;
  const capReason =
    rowCap !== undefined && rowCap > 0 && rowCap === effective
      ? `provider maxConcurrency=${String(rowCap)}`
      : `effective maxConcurrency=${String(profile.maxConcurrency)}`;
  return `Provider "${input.providerId}" applies ${capReason}; requested workers=${String(base)} was reduced to ${String(effective)}. Effective profile: maxConcurrency=${String(profile.maxConcurrency)}, rpm=${String(profile.rpm)}, rps=${String(profile.rps)}, intervalMs=${String(profile.intervalMs)} (default baseline: maxConcurrency≈${String(providerDefaults.maxConcurrency)}, rpm≈${String(providerDefaults.rpm)}, rps≈${String(providerDefaults.rps)}, intervalMs≈${String(providerDefaults.intervalMs)}).`;
}
