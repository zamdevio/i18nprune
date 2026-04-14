/**
 * Barrel re-export for shared CLI constants. Prefer **`@/constants/<file>.js`** in the main CLI tree;
 * **`apps/report`** may import a subset via the **`i18nprune/constants`** path alias (Vite + tsconfig).
 */
export * from './cli.js';
export * from './docs.js';
export * from './env.js';
export * from './jsonoutput.js';
export * from './links.js';
export * from './update.js';
