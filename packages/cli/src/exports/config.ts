/**
 * @module @zamdevio/i18nprune/config
 * @see {@link https://github.com/zamdevio/i18nprune/blob/main/docs/exports/config.md | Configuration Guide}
 *
 * Type-safe helpers for authoring `i18nprune.config.ts` files.
 * Use this when you want full editor support while defining your project config.
 */

export { defineConfig } from '@/config/define.js';
export type {
  I18nPruneConfig,
  Policies,
  MissingCommandConfig,
  ValidateCommandConfig,
} from '@/types/config/index.js';
