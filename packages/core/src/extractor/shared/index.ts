export { scanProjectSourceFiles } from './projectScan.js';
export type { ScanProjectFileInput, ScanProjectSourceFilesInput } from '../../types/extractor/shared/index.js';

export {
  commentRangesForJsLikeText,
  importBindingScanBlankRanges,
  literalRangesForJsLikeText,
  mergeRanges,
  offsetInCommentRanges,
} from './jslikeTextRanges.js';

export { exactLiteralKeys } from './literals.js';
export { usedRootsFromText } from './roots.js';
export { buildFunctionsPattern, escapeRegex } from './pattern.js';
export { templateKeyRoot } from './template.js';
export { findTranslationCallSites } from './calls.js';
