/**
 * Non-literal translation call heuristics (TS/JS-first).
 * Project-level scanning lives in `./orchestrate.ts` via host-provided inputs.
 */
export {
  tryRebuildTemplateKeyFromConsts,
  tryResolveTemplatePrefixBeforeUnknown,
} from './rebuild.js';
export { snippet, snippetRange, offsetToLineColumn } from './helpers.js';
export {
  commentRangesForJsLikeText,
  importBindingScanBlankRanges,
  literalRangesForJsLikeText,
  mergeRanges,
  offsetInCommentRanges,
} from '../shared/jslikeTextRanges.js';
export {
  findDynamicKeySitesInJavascriptFile,
  findDynamicKeySitesInJavascriptMergedText,
  isJavascriptLikePath,
  JAVASCRIPT_LIKE_EXTENSIONS,
} from './providers/javascript.js';
export { hasDynamicProviderForPath, findDynamicKeySitesForFile } from './providers/index.js';
export { analyzeDynamicKeysFromSourceText, scanProjectDynamicKeySites } from './orchestrate.js';
export type { ScanProjectDynamicKeySitesInput } from '../../types/extractor/dynamic/orchestrate.js';

import type { DynamicKeySite } from '../../types/extractor/dynamic/index.js';
import { findDynamicKeySitesInJavascriptMergedText } from './providers/javascript.js';

/**
 * Merged-text scan over a single concatenated blob. Omits per-file fields; no comment detection.
 */
export function findDynamicKeySites(text: string, functions: string[]): DynamicKeySite[] {
  return findDynamicKeySitesInJavascriptMergedText(text, functions);
}

