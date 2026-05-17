export { exactLiteralKeys, usedRootsFromText, buildFunctionsPattern, escapeRegex, templateKeyRoot, findTranslationCallSites } from '../extractor/shared/index.js';

export * as constmap from '../extractor/constmap/index.js';
export * as dynamic from '../extractor/dynamic/index.js';
export * as keySites from '../extractor/keySites/index.js';
export * as shared from '../extractor/shared/index.js';

export { buildConstStringMap } from '../extractor/constmap/build.js';
export { resolveKeyPlaceholdersWithTrace } from '../extractor/constmap/resolve.js';

export {
  commentRangesForJsLikeText,
  offsetInCommentRanges,
  offsetToLineColumn,
  snippet,
  snippetRange,
  tryRebuildTemplateKeyFromConsts,
  tryResolveTemplatePrefixBeforeUnknown,
  findDynamicKeySites,
  analyzeDynamicKeysFromSourceText,
  scanProjectDynamicKeySites,
  findDynamicKeySitesForFile,
  findDynamicKeySitesInJavascriptFile,
  findDynamicKeySitesInJavascriptMergedText,
  hasDynamicProviderForPath,
  isJavascriptLikePath,
  JAVASCRIPT_LIKE_EXTENSIONS,
} from '../extractor/dynamic/index.js';

export { lineNumberAtIndex, scanKeyObservations, resolvedKeysFromObservations } from '../extractor/keySites/index.js';
export { scanProjectKeyObservations } from '../extractor/keySites/index.js';
export { literalKeyUsageFromObservations, scanProjectLiteralKeyUsage } from '../extractor/keySites/projectUsage.js';
export type { ScanKeyObservationsOptions } from '../extractor/keySites/scan.js';
export type { ScanProjectKeyObservationsInput } from '../extractor/keySites/orchestrate.js';
export type { ScanProjectLiteralKeyUsageInput } from '../extractor/keySites/projectUsage.js';

export type { ProjectLiteralKeyUsage } from '../types/extractor/projectLiteralKeyUsage.js';
export type { ResolveKeyPlaceholdersTraceResult } from '../types/extractor/constmap/index.js';
export type { TranslationCallSite } from '../types/extractor/calls/index.js';
export type { DynamicKeySite, DynamicKeySiteKind } from '../types/extractor/dynamic/index.js';
export type { ScanProjectDynamicKeySitesInput } from '../extractor/dynamic/orchestrate.js';
export type {
  ConstSubstitutionStep,
  KeyObservation,
  SourceSpan,
  TemplatePartialKeyObservation,
  TemplateResolvedKeyObservation,
} from '../types/extractor/keySites/index.js';
