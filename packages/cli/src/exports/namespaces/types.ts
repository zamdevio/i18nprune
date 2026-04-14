export type { CleanupJsonOutput } from '@/types/command/cleanup/json.js';
export type { MissingJsonOutput } from '@/types/command/missing/json.js';
export type { SyncJsonOutput } from '@/types/command/sync/json.js';
export type { ValidateJsonOutput } from '@/types/command/validate/json.js';
export type { I18nPruneConfig, Policies } from '@/types/config/index.js';
export type { Context, ResolvedPaths } from '@/types/core/context/index.js';
export type {
  ConstSubstitutionStep,
  DynamicKeyRef,
  DynamicKeySite,
  DynamicKeySiteKind,
  KeyObservation,
  LiteralKeyObservation,
  SourceSpan,
  TemplatePartialKeyObservation,
  TemplateResolvedKeyObservation,
} from '@/types/core/extractor/index.js';
export type { ProjectLiteralKeyUsage } from '@/types/core/extractor/keySites/index.js';
export type {
  CliJsonEnvelope,
  ErrResult,
  Issue,
  IssueSeverity,
  OkResult,
  Result,
  ResultMeta,
} from '@/types/core/json/envelope.js';
export type { ReviewJsonData, ReviewJsonOpts } from '@/types/command/review/json.js';
export type { GenerateJsonPayload, GenerateTargetJsonRow } from '@/types/command/generate/json.js';
export type {
  LocalesDeleteJsonPayload,
  LocalesDynamicJsonPayload,
  LocalesEditJsonPayload,
  LocalesListJsonPayload,
  LocalesListJsonRow,
} from '@/types/command/locales/json.js';
export type { ReportCliJsonPayload } from '@/types/command/report/json.js';
export type { ReportCliRunOptions } from '@/types/command/report/index.js';
