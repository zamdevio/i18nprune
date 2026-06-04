import { resolveCliVersion } from './version.js';

/**
 * Program name (binary + root command). Used for config filenames, help, banners, etc.
 *
 * **`apps/report/index.html` `<title>`** is plain HTML and cannot import this constant — keep it in sync manually
 * when renaming the tool (the report SPA imports via **`@i18nprune/cli/constants`**).
 */
export const CLI_NAME = 'i18nprune';

/** Semantic version from root `package.json` (injected at `cli:build`; see `version.ts`). */
export const CLI_VERSION = resolveCliVersion();

/** Config filename base (without extension). Change this to rename the config file across the entire tool. */
export const CONFIG_BASE_NAME = `${CLI_NAME}.config`;

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
     