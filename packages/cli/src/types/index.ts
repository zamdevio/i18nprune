export type { EnsureConfigOptions } from '@/types/config/init.js';

export type {
  Context,
  ResolvedPaths,
  ContextMeta,
  FieldSources,
  CliGlobalOverrides,
  ConfigLayer,
} from '@/types/core/context/index.js';
export type { I18nPruneEnvKey, I18nPruneEnvSnapshot } from '@/types/core/context/env.js';
export type { LogGate, LoggerMask } from '@/types/core/logger/index.js';
export type { CommandSummary } from '@/types/cli/output/index.js';
export type { CommandOutputHooks, OutputHookContext } from '@/types/cli/output/orchestration.js';
export type { DiscoveryResult } from '@/types/core/discovery/index.js';
export type {
  ProgressCallbacks,
  TranslationProgress,
  SessionProgressOptions,
  TargetProgressSummary,
} from '@/types/core/progress/index.js';
export type { ExtractorProjectScanInput } from '@/types/shared/extractor/index.js';
export type { EmitCliJsonOptionErrorInput } from '@/types/shared/result/index.js';
export type { PromptRemovalKeysMode, PromptRemovalKeysOptions } from '@/types/shared/ask/index.js';
export type {
  CacheFileDelta,
  CacheDispatchReason,
  CacheDispatchStatus,
  CacheProjectFileRecord,
  CacheProjectFilesState,
  CacheProjectRunState,
  CacheProjectsIndex,
  CliCacheDisableReason,
  CliCacheState,
  CliCacheWarning,
} from '@/types/shared/cache/index.js';

export type { HeaderOptions, LogLevel } from '@/types/utils/ansi/index.js';
export type { CommandBannerSpec } from '@/types/utils/cli/banner.js';

export type { GenerateOptions } from '@/types/command/generate/index.js';
export type { ReportCliJsonPayload } from '@/types/command/report/json.js';
export type { ReportCliRunOptions } from '@/types/command/report/index.js';
export type { SyncOptions } from '@/types/command/sync/index.js';
export type { CleanupJsonOutput, CleanupOptions } from '@/types/command/cleanup/index.js';
export type { ValidateJsonOutput, ValidateOptions } from '@/types/command/validate/index.js';
export type { QualityOptions } from '@/types/command/quality/index.js';
export type { MissingOptions } from '@/types/command/missing/index.js';
export type { MissingPathDisplayOpts } from '@/types/command/missing/summary.js';

export type { ConfigSnapshot, ResolvedPathKind } from '@/types/commands/config/index.js';
export type { LanguagesCommandOptions } from '@/types/commands/languages/index.js';
export type { DoctorOptions } from '@/types/commands/doctor/index.js';
export type {
  LocalesDeleteOptions,
  LocalesDynamicOptions,
  LocalesEditOptions,
} from '@/types/commands/locales/index.js';
export type {
  LocalesDeleteJsonPayload,
  LocalesDynamicJsonPayload,
  LocalesEditJsonPayload,
  LocalesListJsonPayload,
  LocalesListJsonRow,
} from '@/types/command/locales/json.js';
export type { CanonicalSubcommand } from '@/types/argv/index.js';
