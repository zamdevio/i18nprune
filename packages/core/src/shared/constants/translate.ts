/** Shared hard cap for translation worker concurrency across core and hosts. */
export const TRANSLATE_WORKERS_CAP = 64;

/**
 * Environment variable **names** consumed by the translator. Hosts pass an `env` map; core never
 * touches `process.*`. Keep these co-located with the constants the resolvers read.
 */

export const ENV_TRANSLATE_MAX_WORKERS = 'I18NPRUNE_TRANSLATE_MAX_WORKERS' as const;
export const ENV_TRANSLATE_PROVIDER = 'I18NPRUNE_TRANSLATE_PROVIDER' as const;
export const ENV_TRANSLATE_DEEPL_API_KEY = 'I18NPRUNE_TRANSLATE_DEEPL_API_KEY' as const;
export const ENV_TRANSLATE_LIBRE_URL = 'I18NPRUNE_TRANSLATE_LIBRE_URL' as const;
export const ENV_TRANSLATE_LLM_API_KEY = 'I18NPRUNE_TRANSLATE_LLM_API_KEY' as const;
export const ENV_TRANSLATE_LLM_BASE_URL = 'I18NPRUNE_TRANSLATE_LLM_BASE_URL' as const;
export const ENV_TRANSLATE_LLM_MODEL = 'I18NPRUNE_TRANSLATE_LLM_MODEL' as const;

export type TranslatorEnv = Readonly<Record<string, string | undefined>>;
