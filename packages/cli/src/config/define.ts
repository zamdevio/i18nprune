import { DEFAULT_CONFIG } from '@/config/defaults.js';
import type { I18nPruneConfig } from '@/types/config/index.js';

/**
 * Public helper for **`@zamdevio/i18nprune/config`**: merges partial user input with **defaults**
 * (including `policies`) and normalizes **`functions`** when omitted.
 * Same return type **`I18nPruneConfig`** the CLI loads from disk.
 */
export function defineConfig(config: Partial<I18nPruneConfig>): I18nPruneConfig {
  const refDef = DEFAULT_CONFIG.reference?.defaults;
  const refCmd = DEFAULT_CONFIG.reference?.commands;
  return {
    ...DEFAULT_CONFIG,
    ...config,
    functions: config.functions?.length ? config.functions : DEFAULT_CONFIG.functions,
    policies: { ...DEFAULT_CONFIG.policies, ...config.policies },
    reference: {
      ...DEFAULT_CONFIG.reference,
      ...config.reference,
      defaults: { ...refDef, ...config.reference?.defaults },
      commands: { ...refCmd, ...config.reference?.commands },
    },
    validate: { ...DEFAULT_CONFIG.validate, ...config.validate },
    missing: { ...DEFAULT_CONFIG.missing, ...config.missing },
  };
}
