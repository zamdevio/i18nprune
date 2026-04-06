/** Program name (binary + root command). Used for config filenames, help, banners, etc. */
export const CLI_NAME = 'i18nprune';

/** Config filename base (without extension). Change this to rename the config file across the entire tool. */
export const CONFIG_BASE_NAME = `${CLI_NAME}.config`;

/**
 * Default **source locale** language segment for baked-in config defaults and examples (`locales/<code>.json`).
 * The runtime source-of-truth code is always the basename of the configured `source` path; optional
 * **`sourceLocaleCode`** in config overrides **display** in messages only.
 */
export const DEFAULT_SOURCE_LOCALE_LANGUAGE_CODE = 'en';

/**
 * Default icon for box headers (`header()` when `mark` is omitted) and command banners.
 * **`⚡`** reads as fast / tooling; use **`⛅`** here if you prefer a softer brand mark.
 */
export const CLI_MARK = '⚡';

/** Short line for the root help banner box (below the title). */
export const CLI_ROOT_TAGLINE =
  'Validate keys · sync locales · generate · fill · review · locales · cleanup · doctor';

/**
 * Root `i18nprune --help` description: what the tool does today and what it is moving toward.
 */
export const CLI_ROOT_DESCRIPTION =
  'Validate literal keys in code against the source locale JSON; sync locale file shapes; generate and fill ' +
  'translations; review and measure quality; list and edit locale files under your locales directory; list ' +
  'supported target languages; remove unused keys with optional ripgrep safety; diagnose Node, rg, and paths. ' +
  'Use `--json` on supported commands for CI; `--report-file` for structured output. Supports direct GitHub docs fallback.';
