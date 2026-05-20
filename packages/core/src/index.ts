export * as localeLeaves from './namespaces/localeLeaves.js';
export {
  applyLocaleLeafMode,
  applyLocaleLeafNormalization,
  collectTranslationSurfaceLeaves,
  isCompleteStructuredLocaleLeafMeta,
  isStructuredLocaleLeafNode,
  metadataModeEnabledFromConfig,
  resolveLocaleLeafMode,
} from './namespaces/localeLeaves.js';
export type { ApplyLocaleMetadataModeInput, ResolveLocaleLeafModeInput } from './namespaces/localeLeaves.js';

export * as projects from './namespaces/projects.js';
export { translationSurfacePathValueMap } from './namespaces/projects.js';

export * as placeholders from './namespaces/placeholders.js';
export { mask, restore, validateRestored } from './namespaces/placeholders.js';

export * as translator from './namespaces/translator.js';
export {
  translateLeaf,
  localeJsonValueFromTranslation,
  validateLeafTranslationString,
  createGoogleTranslator,
  parseGtxResponse,
  createLlmTranslator,
  parseOpenAiChatCompletionContent,
  buildTranslationProvidersPayload,
  TRANSLATION_PROVIDER_CREDENTIAL_PRECEDENCE,
  isTranslationProviderId,
  listTranslationProviders,
  resolveTranslator,
  defaultResolvedTranslationOptions,
  validateResolvedTranslationOptions,
  translationRunMeta,
  DEFAULT_PROVIDER_RATE_LIMITS,
  mapWithConcurrency,
  resolveTranslateMaxParallel,
  TRANSLATE_WORKERS_CAP,
  buildIdentityStreakIssue,
  createIdentityStreakGuard,
  IDENTITY_STREAK_SAMPLE_MAX,
  IDENTITY_STREAK_THRESHOLD,
  IdentityAbortError,
  isIdentityTranslation,
  nextIdentityStreakState,
  assertTranslationProviderCredentialsReady,
  effectiveTranslationProviderId,
  resolvedTranslationOptionsFromCliFlag,
  resolveTranslationProviderOptions,
  resolveTranslationProviderOptionsForId,
  resolveTranslationProviderOrder,
  classifyProviderFailureOutcome,
  classifyTranslateFailure,
  createProviderHealthMonitor,
  isRetryableProviderFailure,
  policyKeyForOutcome,
  resolveProviderActionFor,
  TRANSLATE_POLICY_DEFAULTS,
  buildTranslateParallelLimitSuggestion,
  resolveProviderRateLimitProfile,
  resolveTranslateMaxParallelEffective,
  resolveTranslateMaxParallelFromConfig,
  resolveTranslateRateLimitEffective,
  ENV_TRANSLATE_DEEPL_API_KEY,
  ENV_TRANSLATE_LIBRE_URL,
  ENV_TRANSLATE_LLM_API_KEY,
  ENV_TRANSLATE_LLM_BASE_URL,
  ENV_TRANSLATE_LLM_MODEL,
  ENV_TRANSLATE_MAX_WORKERS,
  ENV_TRANSLATE_PROVIDER,
  runTranslate,
  createTranslateContext,
} from './namespaces/translator.js';
export type {
  ProviderAttemptObservation,
  ProviderAttemptOutcome,
  ProviderAttemptReport,
  ProviderHealthMonitor,
  ProviderHealthMonitorOptions,
  ProviderHealthOutcome,
  ResolveProviderActionInput,
  ResolveTranslateMaxParallelInput,
  StartGateHealthCtx,
  TranslateContext,
  TranslateFailureOutcome,
  TranslateHandoffMode,
  TranslatePolicy,
  TranslatePolicyAction,
  TranslatePolicyVerb,
  TranslateRoutingMode,
  TranslateHooks,
  TranslateIdentityGuardOptions,
  TranslateLeafInput,
  TranslateOptions,
  TranslateOutput,
  TranslateResultItem,
  TranslatorEnv,
} from './namespaces/translator.js';
export type {
  ProviderRateLimitProfile,
  ProviderRateLimitRegistry,
  TranslationLeafMeta,
  TranslationLeafMetaPatch,
  TranslateStartRateLimit,
  TranslationProviderYield,
  TranslationProvidersListPayload,
  TranslationResult,
  IdentitySample,
  IdentityStreakConfirmFn,
  IdentityStreakConfirmInput,
  IdentityStreakGuard,
  IdentityStreakGuardOptions,
  IdentityStreakInteractive,
  IdentityStreakState,
} from './namespaces/translator.js';

export { createCoreContext, translateContextFromCore } from './generate/context.js';
export { runGenerate } from './generate/run.js';
export { resolveGenerateLocaleDisplay, resolveLocaleDirection } from './shared/languages/resolveGenerateLocaleDisplay.js';
export type { CoreContext, CoreResolvedPaths } from './types/context/index.js';
export type {
  GenerateHostHooks,
  GenerateJsonPayload,
  GenerateRunHooks,
  GenerateRunOptions,
  GenerateRunResult,
  ProviderAttemptReportJson,
  GenerateTargetJsonRow,
  GenerateTargetProgressSummary,
  HandoffEligibilityRow,
  HandoffOffer,
  IncompleteRunDecision,
  IncompleteRunInfo,
  IncompleteRunReason,
} from './types/generate/index.js';

export * as json from './namespaces/json.js';
export {
  getJsonParseLocation,
  I18nPruneJsonParseError,
  parseJsonText,
  targetLocaleCoversAllSourcePaths,
  tryParseJsonText,
} from './namespaces/json.js';
export { applyPreserveFromSource, mergeToTemplateShape, pruneToTemplateShape } from './namespaces/json.js';
export type {
  JsonParseLocation,
  MergeToTemplateOptions,
  ParseJsonTextOptions,
  PruneToTemplateOptions,
  TryParseJsonTextResult,
} from './namespaces/json.js';

export * as sync from './namespaces/sync.js';
export {
  computeSyncedLocaleJson,
  emitSyncHumanMessages,
  idleLocaleMetadataReportForSkippedSync,
  readLeafDisplayString,
  resolveSyncTargetFiles,
  runSync,
  stripStructuredLeafMetadata,
  summarizeSyncLeavesForHumanLog,
} from './sync/index.js';
export type {
  SyncFileLine,
  SyncHostHooks,
  SyncHumanLeafSummary,
  SyncJsonOutput,
  SyncRunOptions,
  SyncRunResult,
} from './sync/index.js';

export * as preserve from './namespaces/preserve.js';
export {
  filterOutPreservedPaths,
  isPreservePath,
  partitionPreserve,
  pathMatchesPreserveKey,
} from './namespaces/preserve.js';

export * as parity from './namespaces/parity.js';
export { isParityExcluded } from './namespaces/parity.js';

/** Policy types + preserve/parity helpers (same modules as `preserve` / `parity` namespaces). */
export * as policies from './namespaces/policies.js';

export * as cleanup from './namespaces/cleanup.js';
export {
  applyCleanupKeysToLocaleJson,
  computeCleanupCandidateKeys,
  createCleanupSourceWritePlan,
  emitCleanupAbortMessage,
  emitCleanupAskIgnoredMessage,
  emitCleanupCheckOnlyMessage,
  emitCleanupWriteDone,
  emitCleanupWriteIntro,
  pathUnderRoot,
  resolveCleanupKeysWithStringPresencePolicy,
  runCleanup,
  writeCleanupPlan,
} from './namespaces/cleanup.js';
export type {
  CleanupHostHooks,
  CleanupJsonOutput,
  CleanupJsonRunSummary,
  CleanupRunOptions,
  CleanupRunResult,
  CleanupWritePlan,
} from './namespaces/cleanup.js';

export * as patching from './namespaces/patching.js';
export {
  analyzePatchingState,
  applyPatchPlanAtomic,
  buildPatchPlan,
  buildPatchingSectionIncompleteDiagnostic,
  composeLoadersGeneratedFile,
  detectPatchingRecipe,
  patchingBlockPresent,
  resolvePatchingConfigLocales,
  renderGeneratedInnerBlock,
  runPatching,
} from './namespaces/patching.js';

export * as extractor from './namespaces/extractor.js';

export * as analysis from './namespaces/analysis.js';
export {
  resolveProjectAnalysis,
  resolveProjectDynamicSites,
  resolveProjectDynamicSitesCount,
  resolveProjectResolvedKeys,
} from './namespaces/analysis.js';
export type {
  ProjectAnalysis,
  ProjectAnalysisCacheData,
  ProjectAnalysisCounts,
  ProjectAnalysisResolveOptions,
} from './namespaces/analysis.js';

export * as generate from './namespaces/generate.js';
export {
  buildTranslatedLocaleFromSourceLeaves,
  localeJsonHasKeyPath,
  translateAndNormalizeGenerateLocale,
  TranslateRunInterruptedError,
  type TranslateRunPartialStats,
} from './generate/index.js';

export * as init from './namespaces/init.js';
export {
  buildInitConfigTemplate,
  configFileNameForFormat,
  defaultInitConfigFileName,
  DEFAULT_INIT_CONFIG_IMPORT_SPECIFIER,
  detectInitProject,
  formatInitPresetIdList,
  getInitPresetConfigFields,
  initPackageDeclares,
  INIT_PRESET_IDS,
  isInitAutoAmbiguous,
  isInitPresetId,
  pickTopInitPreset,
  readInitPackageJson,
  readInitTopologySignals,
  runInit,
  scoreInitPresets,
} from './namespaces/init.js';
export type {
  BuildInitConfigTemplateOptions,
  InitConfigFormat,
  InitDetectResult,
  InitFilesystemHost,
  InitJsonPayload,
  InitPackageJsonSignals,
  InitPresetConfigFields,
  InitPresetId,
  InitPresetScore,
  InitProjectSignals,
  InitRunOptions,
  InitRunResult,
  InitScoreFactor,
  InitTopologySignals,
  RunInitHostInput,
} from './namespaces/init.js';

export * as validate from './namespaces/validate.js';
export {
  buildValidateHumanView,
  buildValidateIssues,
  buildValidateReportView,
  buildValidateScanPayload,
  compareDottedPathDepth,
  computeMissingLiteralKeysFromResolvedKeys,
  runValidate,
} from './validate/index.js';
export type {
  ValidateHostHooks,
  ValidateJsonPayload,
  ValidateRunOptions,
  ValidateRunResult,
} from './validate/index.js';

export {
  runProjectReadiness,
  resolveProjectReadinessChecks,
  presetUsesValidateSourceIssueCode,
} from './project/readiness/index.js';
export type {
  ProjectReadinessChecks,
  ProjectReadinessCliPreset,
  ProjectReadinessRequest,
  ProjectReadinessResult,
} from './types/project/index.js';

export * as missing from './namespaces/missing.js';
export {
  applyMissingPaths,
  emitMissingPathsPreview,
  emitMissingPlaceholderLeavesPreview,
  emitMissingTargetActionMessage,
  emitMissingTargetWriteIntro,
  parseMissingArrayFromValidateReportJson,
  planMissingPathsFromReport,
  resolveMissingPathsPlan,
  runMissing,
  writeMissingPaths,
} from './namespaces/missing.js';
export type {
  MissingHostHooks,
  MissingJsonTarget,
  MissingJsonOutput,
  MissingRunOptions,
  MissingRunResult,
  MissingSkippedTarget,
  MissingTargetKind,
  MissingTargetPlan,
  MissingTargetState,
  MissingWriteInput,
} from './namespaces/missing.js';

export * as doctor from './namespaces/doctor.js';
export {
  DOCTOR_CHECK_IDS,
  collectDoctorFindingsFromInputs,
  doctorExitCode,
  evaluateConfigFinding,
  evaluatePathsFinding,
  evaluateRuntimeFinding,
  evaluateToolsFinding,
  runDoctor,
} from './namespaces/doctor.js';
export type {
  DoctorCheckId,
  DoctorFinding,
  DoctorHostHooks,
  DoctorJsonPayload,
  DoctorRunOptions,
  DoctorRunResult,
} from './namespaces/doctor.js';

export * as report from './namespaces/report.js';
export {
  buildReportDocument,
  runReport,
} from './namespaces/report.js';
export type {
  BuildReportDocumentInput,
  ReportEnvironmentSnapshot,
  ReportHostHooks,
  ReportJsonPayload,
  ReportRunOptions,
  ReportRunResult,
} from './namespaces/report.js';

export * as share from './namespaces/share.js';
export { buildProjectPayload, runShare } from './share/index.js';

export * as localesDynamic from './namespaces/localesDynamic.js';
export { runDynamic } from './namespaces/localesDynamic.js';
export type {
  DynamicRunOptions,
  DynamicHostHooks,
  DynamicJsonPayload,
  DynamicRunResult,
} from './namespaces/localesDynamic.js';

export { runLocalesList } from './locales/list/index.js';
export {
  readFlatLocaleJsonSurface,
  readLocaleBundle,
  readLocaleJsonFromContextSync,
  writeFlatLocaleJsonDocument,
  writeLocaleBundle,
  writeLocaleJsonFromContextSync,
  resolveLocalesLayout,
  resolveLocalesLayoutFromContext,
  isLocalesLayoutReadSupported,
  isLocalesLayoutWriteSupported,
  listLocaleCodes,
  listLocaleCodesFromContext,
  listLocaleSegments,
  listLocaleSegmentsFromContext,
  resolveLocaleSegmentAbsolutePath,
  localeSegmentRefFromAbsolute,
} from './shared/locales/index.js';
export type { ListJsonPayload, ListRunResult } from './locales/list/index.js';
export {
  buildLocaleJsonByTagFromArchive,
  segmentsForLocaleCode,
} from './shared/locales/index.js';
export type {
  ReadFlatLocaleJsonSurfaceResult,
  ReadLocaleBundleResult,
  WriteFlatLocaleJsonDocumentResult,
  ResolvedLocalesLayout,
  LocalesLayoutMode,
  LocalesLayoutStructure,
  LocaleSegmentRef,
  ListLocaleCodesResult,
  ListLocaleSegmentsResult,
} from './shared/locales/index.js';

export { deleteLocaleFiles } from './locales/delete/index.js';
export type {
  DeleteTargetResult,
  DeleteJsonPayload,
  DeleteRunResult,
} from './locales/delete/index.js';

export * as quality from './namespaces/quality.js';
export { buildQualityJsonData, computeEnglishIdenticalCounts, runQuality } from './namespaces/quality.js';
export type { QualityFileLine, QualityHostHooks, QualityJsonData, QualityRunOptions, QualityRunResult } from './namespaces/quality.js';

export * as review from './namespaces/review.js';
export {
  aggregateReviewRows,
  buildReviewJsonData,
  filterLocaleFilesForReview,
  formatCountMap,
  parseReviewTargetCodes,
  runReview,
} from './namespaces/review.js';
export type {
  ReviewHostHooks,
  ReviewJsonData,
  ReviewLocaleStats,
  ReviewRunOptions,
  ReviewRunResult,
} from './namespaces/review.js';

export { buildProjectTreeFromPaths, emptyDirectoryPathsFromZipKeys } from './project/tree.js';
export type {
  ProjectTreeDirMeta,
  ProjectTreeFileMeta,
  ProjectTreeNode,
  ProjectZipFileMetaForTree,
} from './types/project/index.js';

export * as reference from './namespaces/reference.js';
export {
  buildKeyReferenceContext,
  buildKeyReferenceContextFromLiteralUsageAndDynamicSites,
  buildKeyReferenceContextFromReportDetails,
  pathUnderAnyUncertainPrefix,
  pathUnderUncertainPrefix,
  resolveReferenceConfig,
} from './namespaces/reference.js';

export * as scanner from './namespaces/scanner.js';
export {
  compileScanExclude,
  DEFAULT_SCAN_SKIP_DIR_NAMES,
  listSourceFiles,
  resolveScannerConfig,
  resolveScanExcludeConfig,
  SCAN_EXCLUDE_PRESETS,
  SCANNER_DEFAULT_CONCURRENCY,
  SCANNER_DEFAULT_HARD_CAP,
  SCANNER_DEFAULT_MODE,
  scanSources,
} from './namespaces/scanner.js';

export * as runtime from './namespaces/runtime.js';
export { getRunOptions, resetRunOptions, setRunOptions } from './namespaces/runtime.js';
export {
  assertRuntimeAdapters,
  assertRuntimeFsPort,
  assertRuntimeNetworkPort,
  assertRuntimeSystemPort,
  assertRuntimePathPort,
  assertSyncPortResult,
  createRuntimeSystemPort,
  existsRuntimeFsSync,
  isThenable,
  listRuntimeFsDirSync,
  readJsonFromRuntimeFsSync,
  readRuntimeFsTextSync,
} from './namespaces/runtime.js';
export type {
  RuntimeAdapters,
  RuntimeDirEntry,
  ConfigPathSystemRuntime,
  CoreEngineRuntime,
  ProjectFilesystemRuntime,
  RuntimeFsCap,
  RuntimeFsPort,
  RuntimeKind,
  RuntimeNetworkCap,
  RuntimeNetworkPort,
  RuntimePathCap,
  RuntimePathPort,
  RuntimeReadFsPort,
  RuntimeSystemCap,
  RuntimeSystemPort,
} from './namespaces/runtime.js';

export * as cache from './namespaces/cache.js';
export {
  ANALYSIS_BASENAME,
  CACHE_SCHEMA_VERSION,
  MAX_ANALYSIS_BYTES,
  MAX_PROJECT_FILES_BYTES,
  MAX_PROJECTS_INDEX_BYTES,
  CACHE_PROFILE_DEFAULTS,
  computeCacheContentHash,
  computeCacheProjectId,
  computeInputFilesEpoch,
  DEFAULT_CACHE_PROFILE_ID,
  resolveCacheConfig,
  resolveCacheRebuildConfig,
  defaultProjectFilesState,
  defaultProjectsIndex,
  diffProjectFiles,
  emitCacheDispatchMessages,
  emitCacheMemoryHitMessage,
  emitAnalysisCacheInvalidationMessage,
  getOrBuildCachedProjectData,
  initializeCacheState,
  invalidateProjectAnalysisCache,
  invalidateProjectAnalysisCacheAfterLocaleWrites,
  decideProjectAnalysisCacheInvalidation,
  isProjectCacheWritable,
  layoutMatches,
  loadProjectFilesState,
  loadProjectRunState,
  loadProjectsIndex,
  maybeHealCacheIndex,
  mergeTrackedFileMaps,
  normalizeProjectRootKey,
  omitSyntheticSourceKey,
  nowIso,
  prepareCacheForRun,
  readJsonFileWithLimit,
  resolveAnalysisCachePath,
  resolveCachedLocalesLayout,
  resolveCacheState,
  saveProjectFilesState,
  saveProjectRunState,
  saveProjectsIndex,
  touchProjectIndex,
  tryDeleteCacheFile,
  writeJsonAtomic,
} from './namespaces/cache.js';
export type {
  AnalysisCacheInvalidationAction,
  AnalysisCacheInvalidationDecision,
  AnalysisCacheInvalidationReason,
  LocaleWriteInvalidationInput,
  AnalysisRebuildDecision,
  CachedLocalesLayout,
  CachedProjectInput,
  CacheDisableReason,
  CacheDispatchInfo,
  CacheDispatchReason,
  CacheDispatchResult,
  CacheDispatchStatus,
  CacheFileDelta,
  CacheProducerContext,
  CacheRebuildConfig,
  CacheRebuildMode,
  CacheProfileId,
  CacheProfileDefaults,
  CacheConfigSource,
  ResolvedCacheConfig,
  ClassifiedCacheFileDelta,
  ClassifiedSrcDelta,
  CacheHashText,
  CacheInputFilesEpochDebug,
  CacheProjectFileRecord,
  CacheProjectFilesState,
  CacheProjectRunState,
  CacheProjectsIndex,
  CacheRuntime,
  CacheState,
  CacheWarning,
} from './namespaces/cache.js';
export * as config from './namespaces/config.js';
export {
  clampTranslateMaxWorkers,
  configSchema,
  ConfigValidationError,
  DEFAULT_CONFIG,
  defineConfig,
  loadCoreConfigFromPath,
  mergeCoreConfigInputs,
  mergePartialConfigIntoBase,
  localesFilesystemSchema,
  collectLocalesFilesystemConfigWarnings,
  parseI18nPruneConfig,
  REFERENCE_POLICY_SAFE_DEFAULTS,
  resolveCoreConfig,
  resolveCoreConfigLayers,
  resolveTranslateConfig,
  tryLoadCoreConfigFromPath,
} from './namespaces/config.js';
export type {
  CoreConfigInput,
  CoreConfigResolved,
  LoadCoreConfigFromPathInput,
  I18nPruneConfig,
  LocalesFilesystemConfig,
  ResolvedTranslateConfig,
  ResolvedTranslateProviderRow,
  ResolveCoreConfigOptions,
  ResolveTranslateWarning,
  TranslateConfigInput,
  TranslatePolicyConfigInput,
  TranslateProviderRowInput,
  TranslateRateLimitConfigInput,
} from './config/index.js';

export * as docs from './namespaces/docs.js';
export {
  DEMO_REPORT_URL,
  DOCS_ISSUES_PAGE_PATH,
  DOCS_SITE_BASE,
  DOCS_SITE_ORIGIN,
  META_WORKER_URL,
  GITHUB_BASE,
  GITHUB_DOCS_BASE,
  GITHUB_DOCS_TREE_BASE,
  GITHUB_OWNER,
  GITHUB_REPO,
  GITHUB_REPO_URL,
  LICENSE_URL,
  NPM_PACKAGE_NAME,
  NPM_PACKAGE_URL,
  docsCommandUrl,
  getDocsUrl,
  type IssueCodeDocLinkParts,
  issueCodeDocHref,
  issueCodeRepoDocPathForIssueCode,
  resolveIssueCodeDocLink,
  normalizeRepoDocPath,
} from './namespaces/docs.js';

export * as run from './shared/run/index.js';
export {
  emitRunMessage,
  emitRunEvent,
  emitIssuesAsRunErrors,
  emitRunErrorFromUnknown,
  isProgressEvent,
  noopRunEmitter,
  nowMs,
} from './shared/run/index.js';
export type { OperationId, RunEmitter, RunEvent, RunMessageChannel, RunMessageEvent, RunMessageLevel } from './types/shared/run/index.js';

export * as languages from './namespaces/languages.js';
export {
  buildLanguageCatalog,
  filterLanguageCatalog,
  generatedLanguageCatalog,
  getLanguageByCodeFromCatalog,
  languageOftenRtl,
  normalizeLanguageCode,
  suggestCatalogCodesForInvalidInputFromCatalog,
  assertSupportedTargetLanguageCode,
} from './namespaces/languages.js';

export * as locales from './namespaces/locales.js';
export {
  assertNotSourceTargetLocale,
  buildLocaleListRows,
  buildSourceLocaleTruthLabel,
  excludeSourceLocaleSlugs,
  getDisplaySourceLocaleCode,
  getSourceLocaleSlug,
  isSourceLocaleSlug,
  listOtherLocaleCodes,
  parseSyncLangSelection,
  parseLocaleCodesList,
  pickTargetSelector,
  resolveLocaleTargetCodes,
  resolveTargetLocaleSlugs,
  isAllLocaleToken,
  ALL_LOCALES_TOKEN,
  resolveResumeAllTargetCodes,
  resolveResumeTargetCodesFromRaw,
  assertGenerateTargetCodes,
} from './namespaces/locales.js';
export type {
  AssertGenerateTargetCodesInput,
  LocaleListRow,
  ResolveResumeTargetCodesFromRawInput,
  ResolveLocaleTargetCodesInput,
  SourceLocaleContext,
} from './namespaces/locales.js';

export * as errors from './namespaces/errors.js';
export { I18nPruneError, rethrowAsI18n } from './namespaces/errors.js';

export * as result from './namespaces/result.js';
export {
  RESULT_API_VERSION,
  buildCliJsonEnvelope,
  enrichIssuesWithDocHrefs,
  stringifyCliCommandJson,
  stringifyEnvelope,
} from './namespaces/result.js';
export type {
  LocaleLeafFileOrigin,
  LocaleLeafPathApi,
  LocaleLeafDecisionAction,
  LocaleLeafMode,
  LocaleLeafRuntimeKind,
  LocaleMetadataLeafDecision,
  LocaleMetadataPathChange,
  LocaleMetadataRepairReason,
  LocaleMetadataReport,
  StructuredLocaleLeaf,
} from './types/locales/leaves/index.js';
export type { LocaleReadDiagnostic, LocaleReadDiagnosticLevel } from './types/locales/index.js';
export type { MaskedText } from './types/placeholders/index.js';
export type { TranslateRequest, Translator, TranslatorRetryOptions } from './types/translator/index.js';
export { isTranslationProgressParallelPoolPhase } from './progress/translationTickPhase.js';
export type {
  TranslationPoolProgressSnapshot,
  TranslationProgressPhase,
  TranslationTickProgressFn,
  TranslationTickProgressOptions,
} from './types/progress/index.js';
export type {
  DeeplResolvedTranslationOptions,
  GoogleResolvedTranslationOptions,
  LibreResolvedTranslationOptions,
  LlmResolvedTranslationOptions,
  MymemoryResolvedTranslationOptions,
  ResolvedTranslationProviderOptions,
  TranslationClientHints,
  TranslationProviderDescriptor,
  TranslationProviderEnvVar,
  TranslationProviderId,
  TranslationProviderKind,
} from './types/translator/providers.js';
export type { CliErrorCode, NormalizedCliError } from './types/errors/index.js';
export type {
  ListSourceFilesOptions,
  ScanDebugEvent,
  ScanDebugSkipDirectoryEvent,
  ScanDebugSkipFileEvent,
  ScanExcludeConfig,
  ScanExcludeRule,
  SourceScanResult,
} from './types/scanner/index.js';
export type { CompiledScanExclude } from './types/scanner/compile.js';
export type { ScanProjectFilesystemInputBase } from './types/extractor/projectScanInput.js';
export type { RunOptions } from './types/runtime/index.js';
export type {
  LocaleConfigMismatch,
  PatchingAction,
  PatchingAnalyzeOutput,
  PatchingCommandName,
  PatchingConfigInput,
  PatchingDiagnostic,
  PatchingFileEdit,
  PatchingLocaleRecord,
  PatchingMode,
  PatchingPlan,
  PatchingRecipeId,
  PatchingResult,
  PatchingRunInput,
  PatchingRuntimePorts,
  PatchingSkipReason,
  RepairPatchingConfigLocalesResult,
  ResolvePatchingLocalesResult,
  ResolvedPatchingConfig,
} from './types/patching/index.js';
export type { TranslateTargetLanguage } from './types/languages/index.js';
export type {
  CliJsonEnvelope,
  ErrResult,
  Issue,
  IssueSeverity,
  OkResult,
  Result,
  ResultMeta,
} from './types/json/envelope/index.js';
export {
  DEFAULT_MISSING_LEAF_PLACEHOLDER,
  MISSING_LEAF_PLACEHOLDER_MAX_LEN,
  resolveMissingLeafPlaceholder,
} from './missing/index.js';
export {
  LIST_WINDOW_DEFAULT_TOP,
  LIST_WINDOW_HARD_CAP,
  applyListWindow,
  resolveListWindow,
} from './shared/options/index.js';
export type { ListWindowInput, ListWindowResolved, ResolveListWindowOptions } from './shared/options/index.js';
export {
  ISSUE_CLEANUP_RIPGREP_UNAVAILABLE,
  ISSUE_CLEANUP_UNCERTAIN_PATHS_EXCLUDED,
  ISSUE_CLI_INVALID_JSON_PRETTY,
  ISSUE_SHARE_JSON_REPAIRED,
  ISSUE_SHARE_JSON_WRITE_FAILED,
  ISSUE_SHARE_REMOTE_ERROR,
  ISSUE_SHARE_REMOTE_PAYLOAD_TOO_LARGE,
  ISSUE_SHARE_REMOTE_PROJECT_NOT_FOUND,
  ISSUE_SHARE_REMOTE_REPORT_NOT_FOUND,
  ISSUE_SHARE_REMOTE_REPORT_REJECTED,
  ISSUE_SHARE_REMOTE_UNAVAILABLE,
  ISSUE_SHARE_REMOTE_UPLOAD_REJECTED,
  ISSUE_SHARE_SNAPSHOT_EMPTY,
  ISSUE_SHARE_ZIP_FAILED,
  ISSUE_CONFIG_INVALID,
  ISSUE_CONFIG_LOAD_FAILED,
  ISSUE_CONFIG_MISSING,
  ISSUE_CONTEXT_DISCOVERY_WARNING,
  ISSUE_CONTEXT_RESOLUTION_FAILED,
  ISSUE_IO_READ_FAILED,
  ISSUE_LANGUAGES_EMPTY_FILTER,
  ISSUE_LANGUAGES_UNSUPPORTED_LANGUAGE_CODE,
  ISSUE_LOCALE_SOURCE_PLACEHOLDER_LEAVES,
  ISSUE_LOCALE_TARGET_PLACEHOLDER_LEAVES,
  ISSUE_LOCALES_USAGE,
  ISSUE_LOCALE_TARGET_NOT_FOUND,
  ISSUE_MISSING_PATHS_NOT_IN_SCAN,
  ISSUE_PATCHING_CATALOG_MISMATCH_DIRECTION,
  ISSUE_PATCHING_CATALOG_MISMATCH_ENGLISH,
  ISSUE_PATCHING_CATALOG_MISMATCH_NATIVE,
  ISSUE_PATCHING_CONFIG_INVALID_SCHEMA,
  ISSUE_PATCHING_CONFIG_LOCALE_MISSING_FILE,
  ISSUE_PATCHING_CONFIG_PARSE_FAILED,
  ISSUE_PATCHING_CONFIG_SECTION_INCOMPLETE,
  ISSUE_PATCHING_CONFIG_SIZE_ANOMALY,
  ISSUE_PATCHING_CONFIG_TOO_LARGE,
  ISSUE_PATCHING_FILE_LOCALE_MISSING_CONFIG,
  ISSUE_PROJECT_CONFIG_FILE_MISSING,
  ISSUE_PROJECT_LOCALES_DIR_UNAVAILABLE,
  ISSUE_PROJECT_LOCALES_STRUCTURE_REQUIRED,
  ISSUE_PROJECT_SOURCE_LOCALE_UNAVAILABLE,
  ISSUE_PROJECT_SRC_ROOT_UNAVAILABLE,
  ISSUE_QUALITY_ENGLISH_IDENTICAL_LEAVES,
  ISSUE_REPORT_INVALID_FORMAT,
  ISSUE_SCAN_DYNAMIC_KEY_SITES,
  ISSUE_SYNC_LOCALE_FILE_NOT_FOUND,
  ISSUE_SYNC_METADATA_FLAG_CONFLICT,
  ISSUE_GENERATE_USAGE,
  ISSUE_GENERATE_SOURCE_EMPTY_STRING_LEAVES,
  ISSUE_GENERATE_TRANSLATE_RATE_LIMITED,
  ISSUE_GENERATE_TRANSLATE_NETWORK_ERROR,
  ISSUE_TRANSLATE_IDENTITY_STREAK_ABORT,
  ISSUE_TRANSLATE_IDENTITY_STREAK_WARNING,
  ISSUE_TRANSLATE_MISSING_CREDENTIALS,
  ISSUE_TRANSLATE_PROVIDER_NOT_IMPLEMENTED_YET,
  ISSUE_TRANSLATE_UNKNOWN_TRANSLATION_PROVIDER,
  ISSUE_VALIDATE_DYNAMIC_KEY_SITES,
  ISSUE_VALIDATE_MISSING_LITERAL_KEYS,
  ISSUE_VALIDATE_SOURCE_LOCALE_READ_FAILED,
  ISSUE_DOCTOR_CONFIG_MISSING_FILE,
  ISSUE_DOCTOR_PATHS_DIRECTORIES_MISSING,
  ISSUE_DOCTOR_PATHS_SOURCE_LOCALE_MISSING,
  ISSUE_DOCTOR_RUNTIME_UNSUPPORTED_NODE,
  ISSUE_DOCTOR_TOOLS_RG_NOT_ON_PATH,
} from './shared/constants/index.js';
export {
  detectLocalePlaceholderLeaves,
  detectSourcePlaceholderLeaves,
  formatSourcePlaceholderMessage,
  formatSyncSourcePlaceholderMessage,
  formatTargetPlaceholderMessage,
  issuesFromSourcePlaceholderLeaves,
  issuesFromTargetPlaceholderLeaves,
  sourcePlaceholderValues,
} from './shared/sourcePlaceholders/index.js';
export type { LocalePlaceholderLeaf, SourcePlaceholderLeaf } from './shared/sourcePlaceholders/index.js';
export { deepClone } from './shared/json/clone.js';
export { deleteAtPath, getAtPath, setAtPath, splitPath } from './shared/json/path.js';
export type { PathSegment } from './types/json/path/index.js';
export type { StringLeaf } from './types/json/index.js';
export type * from './namespaces/types.js';
