/**
 * Web-only type barrels (`apps/web/src/types`).
 * Core types stay on `@i18nprune/core`; re-export core-owned shapes here only when the web app is the canonical consumer.
 */
export type * from './app/index.js';
export type * from './worker/index.js';
export type * from './workspace/index.js';
export type * from './constants/index.js';
export type * from './storage/index.js';
