/**
 * @module @zamdevio/i18nprune/core
 * @see {@link https://github.com/zamdevio/i18nprune/blob/main/docs/exports/core.md | Core API Guide}
 *
 * Production-ready programmatic API for i18n automation, CI scripts,
 * custom tooling, and extensions.
 *
 * This is the **same battle-tested logic** used by the CLI — no drift,
 * no subprocesses, full type safety.
 *
 * Symbols are available **flat** (top-level imports) and grouped under **namespaces**
 * (`context`, `extractor`, `dynamic`, …) for discovery — same runtime values.
 */

export { defineConfig } from '@/config/define.js';

export * as context from './namespaces/context.js';
export { resolveContext, clearContextCache } from './namespaces/context.js';

export * as extractor from './namespaces/extractor.js';
export {
  exactLiteralKeys,
  scanKeyObservations,
  resolvedKeysFromObservations,
  scanProjectKeyObservations,
  literalKeyUsageFromObservations,
  scanProjectLiteralKeyUsage,
} from './namespaces/extractor.js';

export * as dynamic from './namespaces/dynamic.js';
export {
  findDynamicKeySites,
  analyzeDynamicKeysFromSourceText,
  scanProjectDynamicKeySites,
  tryRebuildTemplateKeyFromConsts,
  tryResolveTemplatePrefixBeforeUnknown,
} from './namespaces/dynamic.js';

export * as json from './namespaces/json.js';
export { collectStringLeaves } from './namespaces/json.js';

export * as ask from './namespaces/ask.js';
export { canAsk, promptApprovedRemovalKeys, groupKeysByTopSegment } from './namespaces/ask.js';
export type { PromptRemovalKeysMode, PromptRemovalKeysOptions } from './namespaces/ask.js';

export * as preserve from './namespaces/preserve.js';
export { isPreservePath } from './namespaces/preserve.js';

export * as reference from './namespaces/reference.js';
export { buildKeyReferenceContext, resolveReferenceConfig } from './namespaces/reference.js';

export * as validate from './namespaces/validate.js';
export {
  computeMissingLiteralKeys,
  computeMissingLiteralKeysFromResolvedKeys,
  resolvedLiteralKeysInProject,
} from './namespaces/validate.js';

export * as scanner from './namespaces/scanner.js';
export { scanSources } from './namespaces/scanner.js';

export * as files from './namespaces/files.js';
export { readJsonFile } from './namespaces/files.js';

export * as result from './namespaces/result.js';
export {
  RESULT_API_VERSION,
  buildCliJsonEnvelope,
  stringifyCliCommandJson,
  stringifyEnvelope,
} from './namespaces/result.js';

export * as programmatic from './namespaces/programmatic.js';
export {
  tryResolveContext,
  runValidate,
  runConfig,
  buildConfigSnapshot,
  runMissing,
  runSync,
  runCleanupCheck,
  runDoctor,
  collectDoctorFindings,
  doctorExitCode,
  DOCTOR_CHECK_IDS,
  runQuality,
  runReview,
  runLanguages,
  runGenerate,
  runFill,
  runReport,
  ISSUE_CONTEXT_DISCOVERY_WARNING,
  ISSUE_CONTEXT_RESOLUTION_FAILED,
  ISSUE_VALIDATE_DYNAMIC_KEY_SITES,
  ISSUE_VALIDATE_MISSING_LITERAL_KEYS,
  ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED,
  ISSUE_SCAN_DYNAMIC_KEY_SITES,
  ISSUE_MISSING_PATHS_NOT_IN_SCAN,
  ISSUE_SYNC_LOCALE_FILE_NOT_FOUND,
  ISSUE_CLEANUP_UNCERTAIN_PATHS_EXCLUDED,
  ISSUE_CLEANUP_RIPGREP_UNAVAILABLE,
  ISSUE_QUALITY_ENGLISH_IDENTICAL_LEAVES,
  ISSUE_LANGUAGES_EMPTY_FILTER,
  ISSUE_FILL_USAGE,
  ISSUE_IO_READ_FAILED,
} from './namespaces/programmatic.js';

export type * from './namespaces/types.js';
