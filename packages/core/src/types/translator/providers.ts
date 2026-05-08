/**
 * Translation provider registry — **ids**, **descriptors** for clients (CLI help, doctor), and
 * **resolved options** passed into {@link resolveTranslator} (secrets supplied by the client, never logged by core).
 *
 * **LLM backends:** resolved options carry **OpenAI-compatible** fields (`baseUrl`, `apiKey`, `model`); implementations follow later.
 */

/** Registered translation backends (`resolveTranslator` may not implement every id yet). */
export type TranslationProviderId = 'google' | 'mymemory' | 'deepl' | 'libre' | 'llm';

export type TranslationProviderKind = 'public_http' | 'api_key' | 'llm';

/** Declares an env var for docs / CLI validation (names only — never values). */
export type TranslationProviderEnvVar = {
  key: string;
  description: string;
  required: boolean;
};

/**
 * Static metadata for **`--help`**, **`doctor`**, and programmatic discovery.
 * Safe to serialize to JSON (no secrets).
 */
export type TranslationProviderDescriptor = {
  id: TranslationProviderId;
  label: string;
  kind: TranslationProviderKind;
  /** Env vars this provider may read (documented for tooling — values are merged by CLI, not core). */
  envVars: readonly TranslationProviderEnvVar[];
  /** Optional notes for authoring **`translate.providers`** `{ id, … }` rows in **`i18nprune.config.*`**. */
  configKeys?: readonly { key: string; description: string; optional: boolean }[];
};

/**
 * Optional execution hints from the **client** (CLI / host). Core may apply these for retries,
 * pacing, or future AI rate limits — **never** store API tokens here.
 */
export type TranslationClientHints = {
  /** Override max attempts for transient failures (default from `translateLeaf` / provider). */
  maxRetries?: number;
  /** Minimum delay ms between outbound translation requests (future: AI rate limits). */
  minDelayMs?: number;
};

export type GoogleResolvedTranslationOptions = {
  provider: 'google';
  hints?: TranslationClientHints;
};

export type MymemoryResolvedTranslationOptions = {
  provider: 'mymemory';
  /** Optional — raises MyMemory quota when set (per MyMemory docs). */
  contactEmail?: string;
  hints?: TranslationClientHints;
};

export type LibreResolvedTranslationOptions = {
  provider: 'libre';
  /** LibreTranslate-compatible API origin (no trailing slash), e.g. `https://libretranslate.de`. */
  baseUrl?: string;
  hints?: TranslationClientHints;
};

export type DeeplResolvedTranslationOptions = {
  provider: 'deepl';
  /** DeepL API token (provided by CLI from config/env — core must not log). */
  apiKey?: string;
  hints?: TranslationClientHints;
};

/**
 * OpenAI-compatible HTTP API (`/v1/chat/completions`-style hosts).
 * Resolved by CLI from the **`llm`** **`translate.providers`** row + `I18NPRUNE_TRANSLATE_LLM_*` env.
 */
export type LlmResolvedTranslationOptions = {
  provider: 'llm';
  apiKey?: string;
  /** Base URL including protocol, e.g. `https://api.openai.com/v1` or a proxy. */
  baseUrl?: string;
  model?: string;
  hints?: TranslationClientHints;
};

/**
 * Discriminated union — clients construct this from argv + env + config file; core only consumes.
 */
export type ResolvedTranslationProviderOptions =
  | GoogleResolvedTranslationOptions
  | MymemoryResolvedTranslationOptions
  | LibreResolvedTranslationOptions
  | DeeplResolvedTranslationOptions
  | LlmResolvedTranslationOptions;
