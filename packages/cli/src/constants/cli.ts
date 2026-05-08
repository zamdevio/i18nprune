/**
 * Program name (binary + root command). Used for config filenames, help, banners, etc.
 *
 * **`apps/report/index.html` `<title>`** is plain HTML and cannot import this constant — keep it in sync manually
 * when renaming the tool (the Vite app should import **`CLI_NAME`** / **`CLI_VERSION`** from **`i18nprune/constants`**).
 */
export const CLI_NAME = 'i18nprune';

/** Semantic version (keep in sync with package.json). */
export const CLI_VERSION = '0.1.0';

/** Config filename base (without extension). Change this to rename the config file across the entire tool. */
export const CONFIG_BASE_NAME = `${CLI_NAME}.config`;

/**
 * Default **source locale** language segment for baked-in config defaults and examples (`locales/<code>.json`).
 * The runtime source-of-truth locale code is always the normalized basename of the configured **`source`** path.
 */
export const DEFAULT_SOURCE_LOCALE_LANGUAGE_CODE = 'en';

/**
 * Default icon for box headers (`header()` when `mark` is omitted) and command banners.
 * **`⚡`** reads as fast / tooling; use **`⛅`** here if you prefer a softer brand mark.
 */
export const CLI_MARK = '⚡';

/** Short line for the root help banner box (below the title). */
export const CLI_ROOT_TAGLINE =
  'Production-grade i18n operations toolkit';

/**
 * Root `i18nprune --help` description: what the tool does today and what it is moving toward.
 */
export const CLI_ROOT_DESCRIPTION =
  'Production-grade i18n CLI for validation, locale synchronization, translation workflows, quality review, and CI-safe automation.';
     