export {
  clampTranslateMaxWorkers,
  configSchema,
  ConfigValidationError,
  isConfigValidationError,
  defineConfig,
  localesFilesystemSchema,
  parseI18nPruneConfig,
  collectLocalesFilesystemConfigWarnings,
} from './schema/index.js';
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
} from './schema/index.js';
export {
  classifyLocalesSourceInput,
  issueLocalesSourceNotInBundle,
  resolveSourceLocaleAbsoluteFromRelPaths,
  resolveSourceLocaleAbsolutePath,
  validateLocalesSourceConfigValue,
} from './locales/index.js';
export type { LocalesSourceInputKind, LocalesSourceValidationResult } from '../types/config/localesSource.js';

export { CORE_CONFIG_DEFAULT_INPUT } from './defaults/index.js';
export { DEFAULT_CONFIG, REFERENCE_POLICY_SAFE_DEFAULTS } from './defaults/index.js';
export { loadCoreConfigFromPath, tryLoadCoreConfigFromPath } from './resolve/index.js';
export { mergeCoreConfigInputs, resolveCoreConfig, resolveCoreConfigLayers } from './resolve/index.js';
export { mergePartialConfigIntoBase } from './resolve/index.js';
export { resolveTranslateConfig } from './resolve/index.js';
export type {
  CoreConfigInput,
  CoreConfigResolved,
  ResolvedTranslateConfig,
  ResolvedTranslateProviderRow,
  ResolveCoreConfigOptions,
  ResolveTranslateWarning,
  TranslateConfigInput,
  TranslatePolicyConfigInput,
  TranslateProviderRowInput,
  TranslateRateLimitConfigInput,
} from '../types/config/index.js';
export type {
  EffectiveReferenceConfig,
  ReferenceCommandOverrides,
  ReferenceCommands,
  ReferenceConfig,
  ReferenceDefaults,
  StringPresencePolicy,
  UncertainKeyPolicy,
} from '../types/reference/index.js';
export type { LoadCoreConfigFromPathInput, CoreConfigLayer } from '../types/config/resolveLayers.js';
