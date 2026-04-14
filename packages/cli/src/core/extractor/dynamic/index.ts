/**
 * Non-literal translation call heuristics (TS/JS-first). See `docs/dynamic/README.md`.
 * Project-wide scan: `scanProjectDynamicKeySites` in `./orchestrate.js`.
 */
export {
  tryRebuildTemplateKeyFromConsts,
  tryResolveTemplatePrefixBeforeUnknown,
} from '@/core/extractor/dynamic/rebuild.js';
export { snippet, offsetToLineColumn } from '@/core/extractor/dynamic/helpers.js';
export { commentRangesForJsLikeText, offsetInCommentRanges } from '@/core/extractor/dynamic/comment.js';
export {
  findDynamicKeySitesInJavascriptFile,
  findDynamicKeySitesInJavascriptMergedText,
  isJavascriptLikePath,
  JAVASCRIPT_LIKE_EXTENSIONS,
} from '@/core/extractor/dynamic/providers/javascript.js';
export { hasDynamicProviderForPath, findDynamicKeySitesForFile } from '@/core/extractor/dynamic/providers/index.js';
export { analyzeDynamicKeysFromSourceText, scanProjectDynamicKeySites } from '@/core/extractor/dynamic/orchestrate.js';

import type { DynamicKeySite } from '@/types/core/extractor/dynamic/index.js';
import { findDynamicKeySitesInJavascriptMergedText } from '@/core/extractor/dynamic/providers/javascript.js';

/**
 * Legacy merged-text API (single concatenated blob). Omits per-file fields; no comment detection.
 * Prefer {@link scanProjectDynamicKeySites} for full per-file context.
 */
export function findDynamicKeySites(text: string, functions: string[]): DynamicKeySite[] {
  return findDynamicKeySitesInJavascriptMergedText(text, functions);
}
