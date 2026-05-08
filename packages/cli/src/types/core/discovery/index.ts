import type { I18nPruneConfig } from '@i18nprune/core/config';

export type DiscoveryResult = {
  patch: Partial<I18nPruneConfig>;
  warnings: string[];
};
