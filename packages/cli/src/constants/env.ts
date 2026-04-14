/**
 * Canonical environment variable **names** for i18nprune.
 * Import these instead of string literals so renames and tooling stay in sync.
 *
 * See **`docs/config/env.md`** in the repository for descriptions.
 */

/** Standard CI detection (e.g. GitHub Actions sets `CI=true`). */
export const ENV_CI = 'CI' as const;

/**
 * Default cap for **`missing`** human path listings when the CLI omits **`--top`**.
 * Valid values: positive integers in **1…100000**; invalid values are ignored (falls back to config then **10**).
 */
export const ENV_MISSING_DISPLAY_DEFAULT_TOP = 'MISSING_DISPLAY_DEFAULT_TOP' as const;

/**
 * When truthy (`1`, `true`, `yes`), skip the **npm registry** update check (e.g. after `doctor`).
 * See **`docs/versioning/README.md`** (user) and **`docs/phases/versioning.md`** (maintainer notes).
 */
export const ENV_I18NPRUNE_NO_UPDATE_CHECK = 'I18NPRUNE_NO_UPDATE_CHECK' as const;

// --- I18NPRUNE_* (config merge + values included in `config --json` env snapshot) ---

export const ENV_I18NPRUNE_SOURCE = 'I18NPRUNE_SOURCE' as const;
export const ENV_I18NPRUNE_LOCALES_DIR = 'I18NPRUNE_LOCALES_DIR' as const;
export const ENV_I18NPRUNE_SRC = 'I18NPRUNE_SRC' as const;
export const ENV_I18NPRUNE_FUNCTIONS = 'I18NPRUNE_FUNCTIONS' as const;
export const ENV_I18NPRUNE_NO_DISCOVERY = 'I18NPRUNE_NO_DISCOVERY' as const;
export const ENV_I18NPRUNE_NO_INIT = 'I18NPRUNE_NO_INIT' as const;

/** Keys surfaced in the **`i18nprune config --json`** `env` block (`I18NPRUNE_*` plus update opt-out). */
export const I18NPRUNE_ENV_KEYS = [
  ENV_I18NPRUNE_SOURCE,
  ENV_I18NPRUNE_LOCALES_DIR,
  ENV_I18NPRUNE_SRC,
  ENV_I18NPRUNE_FUNCTIONS,
  ENV_I18NPRUNE_NO_DISCOVERY,
  ENV_I18NPRUNE_NO_INIT,
  ENV_I18NPRUNE_NO_UPDATE_CHECK,
] as const;

// --- `generate` command defaults (merge before CLI flags) ---

export const ENV_I18NPRUNE_GENERATE_LANG = 'I18NPRUNE_GENERATE_LANG' as const;
export const ENV_I18NPRUNE_GENERATE_ENGLISH_NAME = 'I18NPRUNE_GENERATE_ENGLISH_NAME' as const;
export const ENV_I18NPRUNE_GENERATE_NATIVE_NAME = 'I18NPRUNE_GENERATE_NATIVE_NAME' as const;
export const ENV_I18NPRUNE_GENERATE_DIRECTION = 'I18NPRUNE_GENERATE_DIRECTION' as const;
export const ENV_I18NPRUNE_GENERATE_NO_META = 'I18NPRUNE_GENERATE_NO_META' as const;
export const ENV_I18NPRUNE_GENERATE_FORCE = 'I18NPRUNE_GENERATE_FORCE' as const;
export const ENV_I18NPRUNE_GENERATE_DRY_RUN = 'I18NPRUNE_GENERATE_DRY_RUN' as const;

export {
  PROJECT_REPORT_KIND,
  REPORT_INLINE_PAYLOAD_PLACEHOLDER,
} from '@zamdevio/i18nprune/report';
