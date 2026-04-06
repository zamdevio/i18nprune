/**
 * Public programmatic surface for automation and extensions.
 * Prefer importing subpaths: `@zamdevio/i18nprune/core`.
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
