/**
 * npm update discovery: registry URL, on-disk state schema version, and background throttle.
 * Env var names for opt-out stay in {@link ./env.js `env.ts`} (`I18NPRUNE_NO_UPDATE_CHECK`).
 *
 * User docs: **`docs/versioning/README.md`**.
 */

/** Public npm registry URL for **`i18nprune`** `latest` (persisted in local update state on disk). */
export const NPM_REGISTRY_LATEST_URL =
  'https://registry.npmjs.org/i18nprune/latest' as const;

/** Bump when the on-disk update state JSON shape changes (forward-compat readers can branch). */
export const UPDATE_STATE_SCHEMA_VERSION = 1 as const;

/** Minimum ms between automatic registry checks (banner / `preAction`). */
export const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
