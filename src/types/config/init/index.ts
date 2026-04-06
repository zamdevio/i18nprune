export type ConfigFormat = 'ts' | 'mts' | 'js' | 'mjs';

export type EnsureConfigOptions = {
  yes?: boolean;
  /** When a config file already exists, skip the informational “Config already exists …” line. */
  silentIfExists?: boolean;
};
