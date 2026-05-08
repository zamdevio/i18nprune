/** Shared hard cap for translation worker concurrency across core and hosts. */
export const TRANSLATE_WORKERS_CAP = 64;

/** Env var used when resolving effective translate workers. */
export const ENV_TRANSLATE_MAX_WORKERS = 'I18NPRUNE_TRANSLATE_MAX_WORKERS' as const;
