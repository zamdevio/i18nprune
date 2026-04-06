/** Env vars read by i18nprune (single source for snapshot + merge order). */
export const I18NPRUNE_ENV_KEYS = [
  'I18NPRUNE_SOURCE',
  'I18NPRUNE_LOCALES_DIR',
  'I18NPRUNE_SRC',
  'I18NPRUNE_FUNCTIONS',
  'I18NPRUNE_NO_DISCOVERY',
  'I18NPRUNE_NO_INIT',
] as const;

export type I18nPruneEnvKey = (typeof I18NPRUNE_ENV_KEYS)[number];

export type I18nPruneEnvSnapshot = Partial<Record<I18nPruneEnvKey, string | undefined>>;
