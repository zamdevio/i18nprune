export type EnsureConfigOptions = {
  yes?: boolean;
  /** When a config file already exists, skip the informational “Config already exists …” line. */
  silentIfExists?: boolean;
  /** Write the expanded “all namespaces” starter template (see **`i18nprune init --rich`**). */
  rich?: boolean;
};
