import type { I18nPruneConfigParsed } from './schema/index.js';
import type { ReferenceConfig as CoreReferenceConfig } from '../types/reference/index.js';
import type { ParityPolicy, PreservePolicy } from '../types/policies/index.js';
import type { ScanExcludeConfig, ScannerConfigInput } from '../types/scanner/index.js';
import type { PatchingConfigInput } from '../types/patching/index.js';
import type { TranslationProviderId } from '../types/translator/providers.js';
import type { TranslatePolicy } from '../types/translator/policy.js';

export {
  clampTranslateMaxWorkers,
  configSchema,
  ConfigValidationError,
  defineConfig,
  parseI18nPruneConfig,
} from './schema/index.js';
/** Optional per-backend rate-limit knobs (merged with provider defaults when omitted). */
export type TranslateRateLimitConfig = {
  maxConcurrency?: number;
  rpm?: number;
  rps?: number;
  intervalMs?: number;
};

/**
 * Google Translate web (**`gtx`**) row in **`translate.providers`**.
 */
export type TranslateProviderRowGoogle = {
  id: 'google';
  enabled?: boolean;
  rateLimit?: TranslateRateLimitConfig;
};
/**
 * MyMemory API row - optional **`contactEmail`**.
 */
export type TranslateProviderRowMymemory = {
  id: 'mymemory';
  enabled?: boolean;
  contactEmail?: string;
  rateLimit?: TranslateRateLimitConfig;
};
/** LibreTranslate-compatible row - optional **`baseUrl`**. */
export type TranslateProviderRowLibre = {
  id: 'libre';
  enabled?: boolean;
  baseUrl?: string;
  rateLimit?: TranslateRateLimitConfig;
};
/** DeepL row - **`apiKey`** optional when using env instead. */
export type TranslateProviderRowDeepL = {
  id: 'deepl';
  enabled?: boolean;
  apiKey?: string;
  rateLimit?: TranslateRateLimitConfig;
};
/** LLM row - **`apiKey`**, **`baseUrl`**, **`model`**. */
export type TranslateProviderRowLlm = {
  id: 'llm';
  enabled?: boolean;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  rateLimit?: TranslateRateLimitConfig;
};

export type TranslateProviderRow =
  | TranslateProviderRowGoogle
  | TranslateProviderRowMymemory
  | TranslateProviderRowLibre
  | TranslateProviderRowDeepL
  | TranslateProviderRowLlm;

/**
 * Max concurrent **`translateLeaf`** jobs when **`--workers`** and env omit (**`1`** = serial).
 * Author as a plain integer **`1…64`** (**`defineConfig`** / Zod clamp via **`clampTranslateMaxWorkers`**).
 */
export type TranslateMaxWorkersConfig = number;

/**
 * Orchestration policy for `generate` / `fill`. Re-export of {@link TranslatePolicy} so
 * config-namespace consumers get the full verb dictionary in one barrel.
 *
 * Omit fields when authoring — `parseI18nPruneConfig` applies defaults from
 * `TRANSLATE_POLICY_DEFAULTS`. `maxAttempts` defaults to `providers.length` at parse time.
 */
export type TranslatePolicyConfig = TranslatePolicy;

export type { ParityPolicy, PreservePolicy };

/**
 * High-level merge / parity rules applied across **`fill`**, **`sync`**, **`quality`**, **`cleanup`**, etc.
 * See **`PreservePolicy`** / **`ParityPolicy`** for field shapes.
 */
export type Policies = {
  /** Keys/prefixes that must always mirror the source locale (verbatim copy semantics). */
  preserve?: PreservePolicy;
  /** Keys/prefixes/values excluded from source-identical / drift checks. */
  parity?: ParityPolicy;
};

/**
 * How **`sync`**, **`generate`**, and **`fill`** read/write JSON terminals (plain strings vs structured objects).
 */
export type LocaleLeavesConfig = {
  /**
   * Leaf shape for writers that support both forms.
   * - **`structured`**: `{ value, status, … }` objects (use with **`--metadata`** on writers).
   * - **`legacy_string`**: plain string leaves (default, smallest on-disk shape).
   */
  mode?: 'structured' | 'legacy_string';
  /** Options that apply when running **`sync`** (strip metadata back to strings, etc.). */
  sync?: {
    /**
     * When **`true`**, **`sync`** may rewrite structured **`{ value, … }`** leaves back to plain strings
     * (pairs with CLI **`sync --strip-metadata`**).
     */
    stripMetadata?: boolean;
  };
};

/**
 * Optional settings for the **`missing`** command.
 */
export type MissingCommandConfig = {
  /**
   * String merged at each new key path (code literal present, absent from JSON).
   * Omit -> core **`DEFAULT_MISSING_LEAF_PLACEHOLDER`** (`__I18NPRUNE_MISSING__`).
   */
  placeholder?: string;
};

/**
 * Human-readable list caps (missing keys preview, cleanup prompts, etc.) - **`output.list`** in config.
 */
export type OutputListConfig = {
  /** Default max rows when a command shows a bounded list and **`--top`** is omitted. */
  top?: number;
  /** When **`true`**, show all rows instead of capping (where the command supports it). */
  full?: boolean;
  /** Hard ceiling for list size even when **`full`** is used (core may clamp further). */
  maxCap?: number;
};

/** CLI-wide defaults for human **`list`**-style output (not JSON array caps - those follow payload rules). */
export type OutputConfig = {
  /** Windowing policy for "top N" style human listings. */
  list?: OutputListConfig;
};

/** Loader / generated-file auto-patch contract - same shape as **`PatchingConfigInput`**. */
export type PatchingConfig = PatchingConfigInput;

/**
 * Translation registry for **`generate`** / **`fill`**.
 * Omit entirely to follow **`I18NPRUNE_TRANSLATE_PROVIDER`** env + built-in default (**`google`**) without file rows.
 *
 * **`--provider`** overrides **`translate.primary`** (and **`I18NPRUNE_TRANSLATE_PROVIDER`** sits between CLI and file).
 *
 * Credential merge: **`translate.providers`** row whose **`id`** matches the resolved backend; env **`I18NPRUNE_TRANSLATE_*`**
 * still wins per field when non-empty (**`parse`** + **`resolveTranslationProviderOptions`** unchanged semantically).
 */
export type TranslateConfig = {
  /** Default backend **`id`** when CLI flag and **`I18NPRUNE_TRANSLATE_PROVIDER`** omit. */
  primary: TranslationProviderId;
  /** Backend roster (unique **`id`** per row; **`enabled: false`** skips a row). */
  providers: TranslateProviderRow[];
  /** Orchestration presets; omit keys to inherit parse-time defaults. */
  policy?: TranslatePolicyConfig;
  /**
   * Max parallel jobs when **`--workers`** / **`I18NPRUNE_TRANSLATE_MAX_WORKERS`** omit - defaults **`1`** when omitted.
   */
  workers?: TranslateMaxWorkersConfig;
};

/**
 * Fully merged i18nprune project config (file + defaults + parse normalization).
 */
export type I18nPruneConfig = Omit<I18nPruneConfigParsed, 'reference' | 'translate' | 'policies'> & {
  /** Absolute or project-relative path to the **source-of-truth** locale JSON (e.g. **`locales/en.json`**). */
  source: string;
  /** Directory containing **`*.json`** locale files (and optional **`<code>.meta.json`** sidecars). */
  localesDir: string;
  /** Root directory scanned for translation calls (**`t('…')`**, etc.). */
  src: string;
  /** Function names treated as translation helpers when walking **`src`** (at least one required). */
  functions: string[];
  /**
   * When **`true`**, **`generate`** and **`fill`** skip writing **`<lang>.meta.json`**.
   * Merged with CLI **`--no-locale-meta`** (**OR** - either **`true`** skips sidecar writes).
   */
  noLocaleMeta?: boolean;
  /** Human listing caps (**`output.list`**) for previews and summaries. */
  output?: OutputConfig;
  /**
   * Scanner skip rules: extra dirs/files/extensions/path regexes, optional **`production`** preset,
   * and **`useDefaultSkip`** for built-in dir skips (**`node_modules`**, **`dist`**, …).
   */
  exclude?: ScanExcludeConfig;
  /**
   * Optional scan worker hints: **`mode`** (**`serial`** | **`concurrent`** | **`auto`**), **`concurrency`**, **`hardCap`**.
   * Core clamps values to safe ranges.
   */
  scanner?: ScannerConfigInput;
  /** Preserve / parity policy bags consumed by **`fill`**, **`sync`**, **`quality`**, **`cleanup`**, … */
  policies?: Policies;
  /**
   * Reference / uncertainty policy: **`defaults`** plus optional **`commands`** overrides
   * (**`cleanup`**, **`fill`**, **`sync`**, **`generate`**).
   */
  reference?: CoreReferenceConfig;
  /** Structured vs legacy string leaves and **`sync`** metadata stripping defaults. */
  localeLeaves?: LocaleLeavesConfig;
  /** Defaults for **`i18nprune missing`** (listing cap + optional placeholder string). */
  missing?: MissingCommandConfig;
  /**
   * Auto-patch loader wiring (**`patch`**, **`generate --patch`**, …): paths, recipe, size limits, **`warn_skip`** vs **`strict`**.
   */
  patching?: PatchingConfig;
  /** Translation providers and orchestration defaults. */
  translate?: TranslateConfig;
};

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
export type { LoadCoreConfigFromPathInput } from './resolve/index.js';
export type { CoreConfigLayer } from './resolve/index.js';
