import { DEFAULT_PROVIDER_RATE_LIMITS, listTranslationProviders } from '@i18nprune/core';
import type { TranslationProviderId } from '@i18nprune/core';

export type TranslationProviderUiRow = {
  id: TranslationProviderId;
  label: string;
  /** Suggested default CLI `--workers` cap from core rate-limit profile (`maxConcurrency`). */
  defaultWorkers: number;
};

export function buildTranslationProvidersPayload(): TranslationProviderUiRow[] {
  return listTranslationProviders().map((d) => ({
    id: d.id,
    label: d.label,
    defaultWorkers: DEFAULT_PROVIDER_RATE_LIMITS[d.id].maxConcurrency,
  }));
}
