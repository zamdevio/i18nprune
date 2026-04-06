/**
 * @module @zamdevio/i18nprune/core
 * @see {@link https://github.com/zamdevio/i18nprune/blob/main/docs/exports/core.md | Core API Guide}
 *
 * Production-ready programmatic API for i18n automation, CI scripts,
 * custom tooling, and extensions.
 *
 * This is the **same battle-tested logic** used by the CLI — no drift,
 * no subprocesses, full type safety.
 */

export { defineConfig } from '@/config/define.js';
export { resolveContext, clearContextCache } from '@/core/context/index.js';
export { exactLiteralKeys } from '@/core/extractor/index.js';
export {
  findDynamicKeySites,
  analyzeDynamicKeysFromSourceText,
  scanProjectDynamicKeySites,
} from '@/core/dynamic/index.js';
export { collectStringLeaves } from '@/core/json/leaves/index.js';
export { scanSources } from '@/core/scanner/index.js';
export { readJsonFile } from '@/utils/fs/index.js';

export type { I18nPruneConfig, Policies } from '@/types/config/index.js';
export type { Context, ResolvedPaths } from '@/types/core/context/index.js';
export type { DynamicKeySite } from '@/types/core/extractor/index.js';
