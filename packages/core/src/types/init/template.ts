import type { InitLocaleLayoutHint, InitPresetId } from './initRun.js';

export type InitConfigFormat = 'ts' | 'mts' | 'js' | 'mjs';

export type BuildInitConfigTemplateOptions = {
  /** Module specifier for **`defineConfig`** / **`I18nPruneConfig`** (default core config surface). */
  importSpecifier?: string;
  /** When true, include every supported top-level namespace with safe defaults (starting point for customization). */
  rich?: boolean;
  /**
   * Curated starter bundle — seeds **`locales.source`**, **`locales.directory`**, **`src`**, and **`functions`**.
   * Defaults to **`generic`**.
   */
  preset?: InitPresetId;
  /** When set, emitted into the `locales` block (from on-disk segment classification). */
  localeLayout?: InitLocaleLayoutHint | null;
};
