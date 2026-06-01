export { defineConfig } from './define.js';
export { clampTranslateMaxWorkers, translateSchema } from './translate.js';
export { collectLocalesFilesystemConfigWarnings } from './localesCompat.js';
export {
  configSchema,
  ConfigValidationError,
  isConfigValidationError,
  localesFilesystemSchema,
  parseI18nPruneConfig,
} from './root.js';
export type { I18nPruneConfigParsed } from './root.js';
export type { ParityPolicy, PreservePolicy } from '../../types/policies/index.js';
export type {
  I18nPruneConfig,
  CacheConfig,
  LocaleLeavesConfig,
  LocalesFilesystemConfig,
  MissingCommandConfig,
  OutputConfig,
  OutputListConfig,
  PatchingConfig,
  Policies,
  TranslateConfig,
  TranslateMaxWorkersConfig,
  TranslatePolicyConfig,
  TranslateProviderRow,
  TranslateProviderRowDeepL,
  TranslateProviderRowGoogle,
  TranslateProviderRowLibre,
  TranslateProviderRowLlm,
  TranslateProviderRowMymemory,
  TranslateRateLimitConfig,
} from './root.js';
