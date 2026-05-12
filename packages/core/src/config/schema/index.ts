export { defineConfig } from './define.js';
export { clampTranslateMaxWorkers, translateSchema } from './translate.js';
export {
  configSchema,
  ConfigValidationError,
  parseI18nPruneConfig,
} from './root.js';
export type { I18nPruneConfigParsed } from './root.js';
export type {
  I18nPruneConfig,
  CacheConfig,
  LocaleLeavesConfig,
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
