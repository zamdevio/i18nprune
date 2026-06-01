export type {
  LocaleLeafDecisionAction,
  LocaleLeafMode,
  LocaleLeafRuntimeKind,
  LocaleMetadataLeafDecision,
  LocaleMetadataPathChange,
  LocaleMetadataRepairReason,
  LocaleMetadataReport,
  StructuredLocaleLeaf,
} from '../types/locales/leaves/index.js';
export type { MaskedText } from '../types/placeholders/index.js';
export type { PathSegment } from '../types/json/path/index.js';
export type { StringLeaf } from '../types/json/index.js';
export type { TranslateRequest, Translator, TranslatorRetryOptions } from '../types/translator/index.js';
export type { MergeToTemplateOptions } from '../shared/json/merge.js';
export type { PruneToTemplateOptions } from '../shared/json/prune.js';
export type { CliErrorCode, NormalizedCliError } from '../types/errors/index.js';
export type { SourceScanResult } from '../types/scanner/index.js';
export type {
  ResolveScannerConfigOptions,
  ScannerConfigInput,
  ScannerConfigResolved,
  ScannerExecutionMode,
} from '../types/scanner/index.js';
export type { RunOptions } from '../types/runtime/index.js';
export type { TranslateTargetLanguage } from '../types/languages/index.js';
export type {
  CliJsonEnvelope,
  ErrResult,
  Issue,
  IssueSeverity,
  OkResult,
  Result,
  ResultMeta,
} from '../types/json/envelope/index.js';
export type { ResolveMissingPathsPlanInput } from '../types/missing/index.js';
export type {
  PatchingAction,
  PatchingCommandName,
  PatchingConfigInput,
  PatchingDiagnostic,
  PatchingFileEdit,
  PatchingMode,
  PatchingPlan,
  PatchingRecipeId,
  PatchingResult,
  PatchingRunInput,
  PatchingRuntimePorts,
  PatchingSkipReason,
  ResolvedPatchingConfig,
} from '../types/patching/index.js';
export type { LocaleListRow } from '../types/locales/index.js';
export type { ResolveLocaleTargetCodesInput } from '../types/locales/index.js';
export type { ResolveResumeTargetCodesFromRawInput } from '../types/locales/index.js';
export type { AssertGenerateTargetCodesInput } from '../types/locales/index.js';
export type { ParityPolicy, PreservePolicy } from '../types/policies/index.js';
export type {
  KeyReferenceContext,
  EffectiveReferenceConfig,
  ReferenceCommandOverrides,
  ReferenceCommands,
  ReferenceConfig,
  ReferenceConfigSource,
  ReferenceDefaults,
  StringPresencePolicy,
  UncertainKeyPolicy,
} from '../types/reference/index.js';
export type {
  ComputeEnglishIdenticalCountsInput,
  QualityJsonData,
} from '../types/quality/index.js';
export type { DoctorCheckId, DoctorFinding } from '../types/doctor/index.js';
export type { GenerateResumeCandidateLeafInput, GenerateResumeRefContext } from '../types/generate/resumeCandidates.js';
export type { ProjectLiteralKeyUsage } from '../types/extractor/projectLiteralKeyUsage.js';
export type { CleanupCandidateInput } from '../cleanup/candidates.js';
export type { TranslationSurfaceLeaf, TranslationSurfaceShape } from '../types/locales/leaves/index.js';
export type {
  DynamicKeySite,
  DynamicKeySiteKind,
  ConstSubstitutionStep,
  DynamicKeyRef,
  KeyObservation,
  LiteralKeyObservation,
  SourceSpan,
  TemplatePartialKeyObservation,
  TemplateResolvedKeyObservation,
  TranslationCallSite,
} from '../types/extractor/index.js';
export type { ResolveKeyPlaceholdersTraceResult } from '../types/extractor/constmap/index.js';
export type { ScanProjectFileInput, ScanProjectSourceFilesInput } from '../types/extractor/shared/index.js';
export type { ScanKeyObservationsOptions } from '../extractor/keySites/scan.js';
export type { RunEmitter, RunEvent } from '../types/shared/run/index.js';
