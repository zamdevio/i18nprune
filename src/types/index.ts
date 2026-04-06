export type {
  I18nPruneConfig,
  Policies,
  PreservePolicy,
  ParityPolicy,
} from '@/types/config/index.js';
export type { ParsedI18nPruneConfig } from '@/types/config/schema.js';
export type { EnsureConfigOptions } from '@/types/config/init/index.js';

export type {
  Context,
  ResolvedPaths,
  ContextMeta,
  FieldSources,
  CliGlobalOverrides,
  ConfigLayer,
} from '@/types/core/context/index.js';
export type { I18nPruneEnvKey, I18nPruneEnvSnapshot } from '@/types/core/context/env.js';
export type { RunOptions } from '@/types/core/runtime/index.js';
export type { PathSegment } from '@/types/core/json/path.js';
export type { StringLeaf } from '@/types/core/json/index.js';
export type { LogGate, LoggerMask } from '@/types/core/logger/index.js';
export type { CommandSummary } from '@/types/core/output/index.js';
export type { DiscoveryResult } from '@/types/core/discovery/index.js';
export type {
  ProgressCallbacks,
  TranslationProgress,
  SessionProgressOptions,
} from '@/types/core/progress/index.js';
export type { TranslateTargetLanguage } from '@/types/core/languages/catalog.js';
export type { DynamicKeySite } from '@/types/core/extractor/index.js';

export type { HeaderOptions, LogLevel } from '@/types/utils/ansi/index.js';

export type { GenerateOptions } from '@/types/command/generate/index.js';
export type { FillOptions } from '@/types/command/fill/index.js';
export type { SyncOptions } from '@/types/command/sync/index.js';
export type { CleanupOptions } from '@/types/command/cleanup/index.js';
export type { ValidateOptions } from '@/types/command/validate/index.js';
export type { QualityOptions } from '@/types/command/quality/index.js';

export type { ConfigSnapshot, ResolvedPathKind } from '@/types/commands/config/index.js';
export type { LanguagesCommandOptions } from '@/types/commands/languages/index.js';
export type { DoctorCheckId, DoctorFinding, DoctorOptions } from '@/types/commands/doctor/index.js';

export type { CliErrorCode, NormalizedCliError } from '@/types/core/errors/index.js';
export type { Translator, TranslateRequest, TranslatorRetryOptions } from '@/types/core/translator/index.js';
export type { MaskedText } from '@/types/core/placeholders/index.js';
