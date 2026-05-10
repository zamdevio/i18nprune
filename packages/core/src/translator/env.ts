/**
 * Environment variable **names** consumed by the translator. Hosts pass an `env` map; core never
 * touches `process.*`. Keep these co-located with the resolvers that read them.
 */

export { ENV_TRANSLATE_MAX_WORKERS } from '../shared/constants/translate.js';

export const ENV_TRANSLATE_PROVIDER = 'I18NPRUNE_TRANSLATE_PROVIDER' as const;
export const ENV_TRANSLATE_DEEPL_API_KEY = 'I18NPRUNE_TRANSLATE_DEEPL_API_KEY' as const;
export const ENV_TRANSLATE_LIBRE_URL = 'I18NPRUNE_TRANSLATE_LIBRE_URL' as const;
export const ENV_TRANSLATE_LLM_API_KEY = 'I18NPRUNE_TRANSLATE_LLM_API_KEY' as const;
export const ENV_TRANSLATE_LLM_BASE_URL = 'I18NPRUNE_TRANSLATE_LLM_BASE_URL' as const;
export const ENV_TRANSLATE_LLM_MODEL = 'I18NPRUNE_TRANSLATE_LLM_MODEL' as const;

export type TranslatorEnv = Readonly<Record<string, string | undefined>>;
