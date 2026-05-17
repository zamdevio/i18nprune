export type EnsureConfigOptions = {
  yes?: boolean;
  /** Write the expanded “all namespaces” starter template (see **`i18nprune init --rich`**). */
  rich?: boolean;
  /**
   * Score **`package.json`** + locale-folder markers to pick a preset (use with **`--yes`** or **`--json`**
   * in CI; exits **`1`** when signals are ambiguous).
   */
  auto?: boolean;
  /** Curated starter bundle: **`generic`**, **`next-intl`**, or **`i18next`**. */
  preset?: string;
};
