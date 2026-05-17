/**
 * Entire **`shared/`** surface: use **`@i18nprune/core/shared`** for CLI glue and non-root imports.
 * Prefer **`@i18nprune/core`** root for stable primary names; this barrel exposes **namespaced** + **flat** re-exports.
 *
 * Domain engines live in sibling folders (`generate/`, `validate/`, …), not under `shared/`.
 */
export * as json from './json/index.js';
export * as errors from './errors/index.js';
export * as scanner from './scanner/index.js';
export * as placeholders from './placeholders/index.js';
export * as translator from './translator/index.js';
export * as localeLeaves from './locales/leaves/index.js';
export * as localesLayout from './locales/layout/index.js';
export * as localesRead from './locales/read/index.js';
export * as localesWrite from './locales/write/index.js';
export * as projects from './projects/index.js';
export * as sourcePlaceholders from './sourcePlaceholders/index.js';
export * as reference from './reference/paths.js';
export * as options from './options/index.js';
export * as run from './run/index.js';
export * as result from './result/index.js';
export * as languagesCatalog from './languages/catalog/index.js';
export * as constants from './constants/index.js';

/** Flat re-exports of all `shared/**` modules (consumers may import symbols without nested paths). */
export * from './json/index.js';
export * from './locales/index.js';
export * from './projects/index.js';
export * from './translator/index.js';
export * from './placeholders/index.js';
export * from './sourcePlaceholders/index.js';
export * from './scanner/index.js';
export * from './errors/index.js';
export * from './options/index.js';
export * from './run/index.js';
export * from './result/index.js';
export * from './languages/catalog/index.js';
export * from './docs/index.js';
export * from './constants/index.js';
