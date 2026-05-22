/** Config filename base without extension (`i18nprune.config`). */
export const I18NPRUNE_CONFIG_BASENAME = 'i18nprune.config' as const;

/** TS/JS config basenames (init / CLI discovery — no `.json`). */
export const I18NPRUNE_CONFIG_SCRIPT_FILE_NAMES = [
  `${I18NPRUNE_CONFIG_BASENAME}.ts`,
  `${I18NPRUNE_CONFIG_BASENAME}.mts`,
  `${I18NPRUNE_CONFIG_BASENAME}.cts`,
  `${I18NPRUNE_CONFIG_BASENAME}.js`,
  `${I18NPRUNE_CONFIG_BASENAME}.mjs`,
  `${I18NPRUNE_CONFIG_BASENAME}.cjs`,
] as const;

export const I18NPRUNE_CONFIG_SCRIPT_FILE_NAMES_SET = new Set<string>(I18NPRUNE_CONFIG_SCRIPT_FILE_NAMES);

/** JSON-only config basename (parsed without a TS loader). */
export const I18NPRUNE_CONFIG_JSON_FILE_NAME = `${I18NPRUNE_CONFIG_BASENAME}.json` as const;

/** Config basenames collected in share snapshots and zip parse (scripts + JSON). */
export const I18NPRUNE_CONFIG_SNAPSHOT_FILE_NAMES = [
  ...I18NPRUNE_CONFIG_SCRIPT_FILE_NAMES,
  I18NPRUNE_CONFIG_JSON_FILE_NAME,
] as const;

export const I18NPRUNE_CONFIG_SNAPSHOT_FILE_NAMES_SET = new Set<string>(I18NPRUNE_CONFIG_SNAPSHOT_FILE_NAMES);
