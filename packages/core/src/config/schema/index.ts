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
export type {
  I18nPruneConfig,
  CacheConfig,
  LocaleLeavesConfig,
  LocalesFilesystemConfig,
  MissingCommandConfig,
  OutputConfig,
  OutputListConfig,
  ParityPolicy,
  PatchingConfig,
  Policies,
  PreservePolicy,
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
