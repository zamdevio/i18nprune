/**
 * npm update discovery: registry URL, on-disk state schema version, and background throttle.
 * Env var names for opt-out stay in {@link ./env.js `env.ts`} (`I18NPRUNE_NO_UPDATE_CHECK`).
 *
 * User docs: **`docs/cli/cache.md`**.
 */

/** Public npm registry URL for **`i18nprune`** `latest` (persisted in `<home>/state/version.json`). */
export const NPM_REGISTRY_LATEST_URL =
  'https://registry.npmjs.org/i18nprune/latest' as const;

/** Bump when the on-disk `version.json` shape changes (forward-compat readers can branch). */
export const UPDATE_STATE_SCHEMA_VERSION = 1 as const;

/** Minimum ms between automatic registry checks (banner / `preAction`). */
export const UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Releases portal origin — machine-readable release notes for **`version --notes`**. */
export const RELEASES_PORTAL_ORIGIN = 'https://releases.i18nprune.dev' as const;

/** Timeout for release-notes fetches against the portal. */
export const RELEASES_NOTES_FETCH_TIMEOUT_MS = 8000;
