/**
 * Barrel re-export for shared CLI constants. Prefer **`@/constants/<file>.js`** in the main CLI tree.
 * Doc URL helpers live in **`@i18nprune/core`** (import there, not here). **`apps/report`** may use the
 * **`@i18nprune/cli/constants`** for **`CLI_NAME`** / **`CLI_VERSION`** only (e.g. report SPA).
 */
export * from './cli.js';
export * from './env.js';
export * from './jsonoutput.js';
export * from './update.js';
