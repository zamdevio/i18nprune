/**
 * Barrel re-export for shared CLI constants. Prefer **`@/constants/<file>.js`** in the main CLI tree.
 * Doc URL helpers live in **`@i18nprune/core`** (import there, not here). **`apps/report`** may use the
 * **`i18nprune/constants`** alias for **`CLI_NAME`** / **`CLI_VERSION`** only.
 */
export * from './cli.js';
export * from './env.js';
export * from './jsonoutput.js';
export * from './update.js';
