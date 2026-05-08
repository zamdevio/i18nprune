import { defaultResolvedTranslationOptions } from '../../shared/translator/providers/registry.js';
import {
  ENV_TRANSLATE_MAX_WORKERS,
  TRANSLATE_WORKERS_CAP,
} from '../../shared/constants/translate.js';
import { ISSUE_TRANSLATE_CONFIG_DEFAULT_APPLIED } from '../../shared/constants/issueCodes.js';
import {
  DEFAULT_PROVIDER_RATE_LIMITS,
  resolveTranslateMaxParallel,
} from '../../shared/translator/utils/orchestration.js';
import type { TranslationProviderId } from '../../types/translator/providers.js';
import type {
  ResolvedTranslateConfig,
  ResolvedTranslateProviderRow,
  ResolveTranslateWarning,
  TranslateConfigInput,
  TranslateProviderRowInput,
} from '../../types/config/index.js';

function clampInt(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, Math.trunc(n)));
}

function toWarning(message: string): ResolveTranslateWarning {
  return {
    severity: 'warning',
    code: ISSUE_TRANSLATE_CONFIG_DEFAULT_APPLIED,
    message,
  };
}

function pickEnabledProviderRow(
  rows: readonly TranslateProviderRowInput[] | undefined,
  providerId: TranslationProviderId,
): TranslateProviderRowInput | undefined {
  return rows?.find((row) => row.id === providerId && row.enabled !== false);
}

function resolveProviderOrder(input: {
  config: TranslateConfigInput | undefined;
  providerIdPin?: TranslationProviderId;
}): TranslationProviderId[] {
  const head =
    input.providerIdPin ??
    input.config?.primary ??
    defaultResolvedTranslationOptions().provider;
  const order: TranslationProviderId[] = [head];
  if (input.config?.policy?.routing !== 'auto') return order;
  for (const row of input.config?.providers ?? []) {
    if (row.enabled === false) continue;
    if (!order.includes(row.id)) order.push(row.id);
  }
  return order;
}

function resolveProviderProfile(
  config: TranslateConfigInput | undefined,
  providerId: TranslationProviderId,
): ResolvedTranslateProviderRow {
  const defaults = DEFAULT_PROVIDER_RATE_LIMITS[providerId];
  const row = pickEnabledProviderRow(config?.providers, providerId)?.rateLimit;
  const profile = {
    maxConcurrency: clampInt(row?.maxConcurrency ?? defaults.maxConcurrency, 1, TRANSLATE_WORKERS_CAP),
    rpm: row?.rpm ?? defaults.rpm,
    rps: row?.rps ?? defaults.rps,
    intervalMs: row?.intervalMs ?? defaults.intervalMs,
  };
  const startRateLimit =
    profile.rpm === undefined && profile.rps === undefined && profile.intervalMs === undefined
      ? undefined
      : { rpm: profile.rpm, rps: profile.rps, intervalMs: profile.intervalMs };
  return { id: providerId, profile, startRateLimit };
}

export function resolveTranslateConfig(input: {
  config: TranslateConfigInput | undefined;
  env?: Record<string, string | undefined>;
  pin?: { providerId?: TranslationProviderId; workers?: number };
}): { resolved: ResolvedTranslateConfig; warnings: ResolveTranslateWarning[] } {
  const warnings: ResolveTranslateWarning[] = [];
  const routing = input.config?.policy?.routing === 'auto' ? 'auto' : 'single';
  if (input.config === undefined) {
    warnings.push(
      toWarning(
        'translate config omitted; using defaults (provider=google, routing=single, workers=1).',
      ),
    );
  }
  if (input.config?.policy?.routing === undefined) {
    warnings.push(toWarning('translate.policy.routing omitted; defaulting to "single".'));
  }
  const providerOrder = resolveProviderOrder({
    config: input.config,
    providerIdPin: input.pin?.providerId,
  });
  const effectiveProviderId = providerOrder[0]!;
  if (input.config?.primary === undefined && input.pin?.providerId === undefined) {
    warnings.push(toWarning('translate.primary omitted; defaulting to provider "google".'));
  }
  if (input.pin?.providerId !== undefined) {
    warnings.push(toWarning(`provider pin applied; using "${input.pin.providerId}" first.`));
  }

  const requestedWorkers = resolveTranslateMaxParallel({
    configMaxWorkers: input.config?.workers,
    workersFlag: input.pin?.workers,
    envMaxWorkers: input.env?.[ENV_TRANSLATE_MAX_WORKERS],
  });
  if (input.config?.workers === undefined && input.pin?.workers === undefined) {
    warnings.push(toWarning('translate.workers omitted; defaulting to 1 worker.'));
  }
  const providerRows = {} as Record<TranslationProviderId, ResolvedTranslateProviderRow>;
  for (const providerId of Object.keys(DEFAULT_PROVIDER_RATE_LIMITS) as TranslationProviderId[]) {
    providerRows[providerId] = resolveProviderProfile(input.config, providerId);
  }
  const effectiveWorkers = clampInt(
    Math.min(requestedWorkers, providerRows[effectiveProviderId].profile.maxConcurrency),
    1,
    TRANSLATE_WORKERS_CAP,
  );
  if (effectiveWorkers < requestedWorkers) {
    warnings.push(
      toWarning(
        `provider "${effectiveProviderId}" maxConcurrency=${String(providerRows[effectiveProviderId].profile.maxConcurrency)} capped workers from ${String(requestedWorkers)} to ${String(effectiveWorkers)}.`,
      ),
    );
  }

  return {
    resolved: {
      providerOrder,
      effectiveProviderId,
      requestedWorkers,
      effectiveWorkers,
      providers: providerRows,
      routing,
    },
    warnings,
  };
}
