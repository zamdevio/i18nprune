import { DEFAULT_CONFIG } from '@/config/defaults.js';
import type { I18nPruneConfig } from '@/types/config/index.js';

/**
 * Public helper for **`@zamdevio/i18nprune/config`**: merges partial user input with **defaults**
 * (including `policies`) and normalizes **`functions`** when omitted.
 * Same return type **`I18nPruneConfig`** the CLI loads from disk.
 */
export function defineConfig(config: Partial<I18nPruneConfig>): I18nPruneConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    functions: config.functions?.length ? config.functions : DEFAULT_CONFIG.functions,
    policies: { ...DEFAULT_CONFIG.policies, ...config.policies },
  };
}
