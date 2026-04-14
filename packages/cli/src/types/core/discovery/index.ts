import type { I18nPruneConfig } from '@/types/config/index.js';

export type DiscoveryResult = {
  patch: Partial<I18nPruneConfig>;
  warnings: string[];
};
