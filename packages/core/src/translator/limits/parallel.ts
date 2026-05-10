/**
 * Effective parallelism + rate-limit resolution for the translator's per-provider chain.
 *
 * Pure: callers supply config + env. Hosts pass their own env (CLI passes **`process.env`**, Workers pass
 * bindings). The CLI used to own these — they now live in core so **`runTranslate`** and SDK consumers
 * get the same math.
 */

import {
  DEFAULT_PROVIDER_RATE_LIMITS,
  resolveTranslateMaxParallel,
} from '../../shared/translator/utils/orchestration.js';
import { TRANSLATE_WORKERS_CAP } from '../../shared/constants/translate.js';
import type {
  ProviderRateLimitProfile,
  TranslateStartRateLimit,
} from '../../types/translator/rateLimit.js';
import type { TranslateConfigInput } from '../../types/config/index.js';
import type { TranslationProviderId } from '../../types/translator/providers.js';
import { ENV_TRANSLATE_MAX_WORKERS, type TranslatorEnv } from '../env.js';

function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, Math.trunc(n)));
}

/** Resolve max parallel **`translateLeaf`** calls (config + env + CLI override). */
export function resolveTranslateMaxParallelFromConfig(input: {
  config: TranslateConfigInput | undefined;
  workers?: number;
  env: TranslatorEnv;
}): number {
  return resolveTranslateMaxParallel({
    configMaxWorkers: input.config?.workers,
    workersFlag: input.workers,
    envMaxWorkers: input.env[ENV_TRANSLATE_MAX_WORKERS],
  });
}

/** Effective provider defaults + config merge (provider row overrides provider baseline). */
export function resolveProviderRateLimitProfile(input: {
  config: TranslateConfigInput | undefined;
  providerId: TranslationProviderId;
}): ProviderRateLimitProfile {
  const defaults = DEFAULT_PROVIDER_RATE_LIMITS[input.providerId];
  const row = input.config?.providers?.find(
    (p) => p.id === input.providerId && p.enabled !== false,
  )?.rateLimit;
  return {
    maxConcurrency: clampInt(row?.maxConcurrency ?? defaults.maxConcurrency, 1, TRANSLATE_WORKERS_CAP),
    rpm: row?.rpm ?? defaults.rpm,
    rps: row?.rps ?? defaults.rps,
    intervalMs: row?.intervalMs ?? defaults.intervalMs,
  };
}

/** Effective parallelism = min(requested workers, provider effective maxConcurrency). */
export function resolveTranslateMaxParallelEffective(input: {
  config: TranslateConfigInput | undefined;
  workers?: number;
  providerId: TranslationProviderId;
  env: TranslatorEnv;
}): number {
  const base = resolveTranslateMaxParallelFromConfig({
    config: input.config,
    workers: input.workers,
    env: input.env,
  });
  const profile = resolveProviderRateLimitProfile({
    config: input.config,
    providerId: input.providerId,
  });
  return clampInt(Math.min(base, profile.maxConcurrency), 1, TRANSLATE_WORKERS_CAP);
}

/**
 * Effective per-provider timing limits.
 * Merge rule: provider row overrides provider defaults for each key.
 */
export function resolveTranslateRateLimitEffective(input: {
  config: TranslateConfigInput | undefined;
  providerId: TranslationProviderId;
}): TranslateStartRateLimit | undefined {
  const p = resolveProviderRateLimitProfile(input);
  const rpm = p.rpm;
  const rps = p.rps;
  const intervalMs = p.intervalMs;
  if (rpm === undefined && rps === undefined && intervalMs === undefined) return undefined;
  return { rpm, rps, intervalMs };
}

/** Returns a human-readable warning when the requested workers were capped by provider concurrency. */
export function buildTranslateParallelLimitSuggestion(input: {
  config: TranslateConfigInput | undefined;
  workers?: number;
  providerId: TranslationProviderId;
  env: TranslatorEnv;
}): string | undefined {
  const base = resolveTranslateMaxParallelFromConfig({
    config: input.config,
    workers: input.workers,
    env: input.env,
  });
  const effective = resolveTranslateMaxParallelEffective(input);
  if (effective >= base) return undefined;
  const profile = resolveProviderRateLimitProfile({
    config: input.config,
    providerId: input.providerId,
  });
  const providerDefaults = DEFAULT_PROVIDER_RATE_LIMITS[input.providerId];
  const rowCap = input.config?.providers?.find(
    (p) => p.id === input.providerId && p.enabled !== false,
  )?.rateLimit?.maxConcurrency;
  const capReason =
    rowCap !== undefined && rowCap > 0 && rowCap === effective
      ? `provider maxConcurrency=${String(rowCap)}`
      : `effective maxConcurrency=${String(profile.maxConcurrency)}`;
  return `Provider "${input.providerId}" applies ${capReason}; requested workers=${String(base)} was reduced to ${String(effective)}. Effective profile: maxConcurrency=${String(profile.maxConcurrency)}, rpm=${String(profile.rpm)}, rps=${String(profile.rps)}, intervalMs=${String(profile.intervalMs)} (default baseline: maxConcurrency≈${String(providerDefaults.maxConcurrency)}, rpm≈${String(providerDefaults.rpm)}, rps≈${String(providerDefaults.rps)}, intervalMs≈${String(providerDefaults.intervalMs)}).`;
}
