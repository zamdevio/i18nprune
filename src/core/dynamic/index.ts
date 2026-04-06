/**
 * Shared heuristics for **non-literal** translation keys (dynamic / template / runtime-built).
 * Import from here so validate, sync, and related commands stay aligned.
 */
import { findDynamicKeySites } from '@/core/extractor/dynamic.js';
import { scanSources } from '@/core/scanner/index.js';
import type { Context } from '@/types/core/context/index.js';
import type { DynamicKeySite } from '@/types/core/extractor/index.js';

export { findDynamicKeySites } from '@/core/extractor/dynamic.js';

/** Reuse the same scan text as literal extraction to avoid scanning `src/` twice. */
export function analyzeDynamicKeysFromSourceText(
  text: string,
  functions: string[],
): DynamicKeySite[] {
  return findDynamicKeySites(text, functions);
}

/** When you do not already have merged source text, scan once and analyze. */
export function scanProjectDynamicKeySites(ctx: Context): DynamicKeySite[] {
  const { text } = scanSources(ctx.paths.srcRoot);
  return findDynamicKeySites(text, ctx.config.functions);
}
