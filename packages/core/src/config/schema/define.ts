import { DEFAULT_CONFIG } from '../defaults/index.js';
import { clampTranslateMaxWorkers } from './translate.js';
import type { I18nPruneConfig } from './root.js';

/**
 * Typed `defineConfig` for `i18nprune.config.*`.
 * Merges partial user input with defaults and normalizes selected fields.
 */
export function defineConfig(config: Partial<I18nPruneConfig>): I18nPruneConfig {
  const refDef = DEFAULT_CONFIG.reference?.defaults;
  const refCmd = DEFAULT_CONFIG.reference?.commands;
  return {
    ...DEFAULT_CONFIG,
    ...config,
    noLocaleMeta: config.noLocaleMeta ?? DEFAULT_CONFIG.noLocaleMeta,
    functions: config.functions?.length ? config.functions : DEFAULT_CONFIG.functions,
    policies: { ...DEFAULT_CONFIG.policies, ...config.policies },
    reference: {
      ...DEFAULT_CONFIG.reference,
      ...config.reference,
      defaults: { ...refDef, ...config.reference?.defaults },
      commands: { ...refCmd, ...config.reference?.commands },
    },
    missing: { ...DEFAULT_CONFIG.missing, ...config.missing },
    translate:
      config.translate !== undefined
        ? {
            ...DEFAULT_CONFIG.translate,
            ...config.translate,
            workers:
              config.translate.workers === undefined
                ? 1
                : typeof config.translate.workers === 'number'
                  ? clampTranslateMaxWorkers(config.translate.workers)
                  : (config.translate.workers as unknown as number),
          }
        : DEFAULT_CONFIG.translate,
  };
}
