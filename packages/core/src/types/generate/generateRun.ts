import type { I18nPruneConfig } from '../../config/index.js';
import type { Issue } from '../json/envelope/index.js';
import type { LocaleMetadataReport } from '../locales/leaves/index.js';
import type { RuntimeAdapters } from '../runtime/adapters.js';
import type { RunOptions } from '../runtime/index.js';
import type { CacheRuntime, CacheState } from '../cache/index.js';
import type { TranslationProviderId } from '../translator/providers.js';
import type { TranslatorEnv } from '../../shared/constants/translate.js';
import type { IdentityStreakGuard } from '../../translator/identity/guard.js';
import type { IdentityAbortError } from '../../translator/identity/error.js';
import type { TranslationTickProgressFn } from '../progress/index.js';
import type { RunEmitter, RunEvent } from '../../shared/run/index.js';
import type { TranslateFailureOutcome } from '../../translator/policy/classify.js';
import type { ProviderAttemptOutcome } from '../../translator/policy/fallback.js';
import type { GenerateResumeRefContext } from './resumeCandidates.js';

/** Shared per-target counters for JSON payloads (CLI-compatible). */
export type GenerateTargetProgressSummary = {
  sourceLeafCount?: number;
  processedLeafCount?: number;
  translatedLeafCount?: number;
  /** Present on **`generate --resume`** rows (leaves written this run). */
  updatedLeafCount?: number;
  preserveCount?: number;
  paritySkipCount?: number;
  forced?: boolean;
  durationMs?: number;
  requestAttempts?: number;
  requestRetries?: number;
  requestSuccesses?: number;
  requestFailures?: number;
};

/** Resolved project paths (absolute); hosts compute once (CLI: `resolveContext`). */
export type CoreResolvedPaths = {
  readonly sourceLocale: string;
  readonly localesDir: string;
  readonly srcRoot: string;
};

/**
 * L2 bundle for project ops (`runGenerate`, future `runQuality`, …). Same adapters/env rules as
 * {@link TranslateContext}: required, no runtime defaults inside core.
 */
export type CoreContext = {
  readonly config: I18nPruneConfig;
  readonly adapters: RuntimeAdapters;
  readonly env: TranslatorEnv;
  readonly paths: CoreResolvedPaths;
  /**
   * When **`false`**, no **`i18nprune.config.*`** was found on disk (CLI: **`configExists()`**).
   * Hosts omit this field when unknown; **`runProjectReadiness`** only enforces **`configFilePresent`**
   * when **`configFileLoaded === false`**.
   */
  readonly configFileLoaded?: boolean;
  readonly run?: RunOptions;
  readonly cache?: {
    readonly state: CacheState;
    readonly runtime: CacheRuntime;
    /** Pre-loaded `files.json` baseline; shared across sibling dispatches for accurate delta. */
    readonly baselineFiles?: Record<string, import('../cache/index.js').CacheProjectFileRecord>;
  };
};

export type GenerateProgressEmit = (
  e: Omit<Extract<RunEvent, { type: 'run.progress.generate' }>, 'op' | 'runId' | 'at'>,
) => void;

/** Session progress API produced by the host (CLI: {@link createSessionProgress}). */
export type GenerateHostSession = {
  readonly progress: {
    tick(
      current: number,
      total: number,
      label: string,
      options?: import('../progress/index.js').TranslationTickProgressOptions,
    ): void;
    pauseClock?(opts?: { clearBar?: boolean }): void;
    resumeClock?(): void;
  };
  finish(): void;
  fail(): void;
};

export type GenerateFinalizeSummaryInput = {
  target: string;
  englishName: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  targetPath: string;
  metaPath: string | null;
  leafCount: number;
  showMeta: boolean;
  dryRun?: boolean;
};

export type MetaLocaleDefaults = {
  englishName: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
};

/**
 * CLI / Worker wires TTY, prompts, progress bars, and JSON **`run.progress`** here — operation
 * messages use the shared `RunEmitter` / `run.message` channel.
 */
export type GenerateHostHooks = {
  emitProgress: GenerateProgressEmit;
  emit?: RunEmitter;
  runId?: string;

  createSession: () => GenerateHostSession;

  createIdentityStreakGuard: (
    target: string,
    clock: { pauseClock?: () => void; resumeClock?: () => void },
  ) => IdentityStreakGuard;

  buildTickProgressRelay: (input: {
    tick: GenerateHostSession['progress']['tick'];
    target: string;
    translationMeta: { providerId: TranslationProviderId; translationModel?: string };
  }) => TranslationTickProgressFn;

  /** Optional decorative newline before provider-fallback warning (CLI cursor lift). */
  beforeProviderFallbackWarn?: () => void;

  shouldSkipInteractivePrompts: () => boolean;
  canAskInteractive: () => boolean;

  promptMetaLocaleDetails: (defaults: MetaLocaleDefaults) => Promise<MetaLocaleDefaults>;
  promptFullRetranslate: () => Promise<boolean>;

  printPreserveParityReport: (preserveCount: number, paritySkip: number) => void;
  printFinalizeSummary: (input: GenerateFinalizeSummaryInput) => void;

  onIdentityAbortNotice: (err: IdentityAbortError, opts: { dryRun: boolean }) => void;
};

export type ProviderAttemptReportJson = {
  providerId: TranslationProviderId;
  /** Legacy coarse bucket for CLI summaries (`rate_limited` / `network_error` / `non_retryable_error` / `success`). */
  outcome: ProviderAttemptOutcome;
  /**
   * Fine-grained failure taxonomy from {@link classifyTranslateFailure} — present on **failed**
   * attempts only (`translate-policy (shipped)` step 8, `--json` `targetResults[].providerAttempts[]`).
   */
  translateFailureOutcome?: TranslateFailureOutcome;
};

/** One row in {@link GenerateJsonPayload.targetResults}. */
export type GenerateTargetJsonRow = {
  target: string;
  status: 'written' | 'dry_run' | 'skipped_user_declined';
  /** True when this target was written from a partial translate (policy / hook), not a full success. */
  partial?: boolean;
  /** Leaf values updated this run (**`generate --resume`** only). */
  resumeUpdatedLeafCount?: number;
  progress?: GenerateTargetProgressSummary;
  sourceLeafCount?: number;
  preserveCount?: number;
  paritySkip?: number;
  providerAttempts?: ProviderAttemptReportJson[];
  winnerProviderId?: TranslationProviderId;
  fallbackCount?: number;
  markedForReview?: number;
  paths?: { localeJson: string; metaJson: string | null };
  localeMetadata?: LocaleMetadataReport;
};

/** Payload inside `CliJsonEnvelope<'generate', …>` — stable JSON contract. */
export type GenerateJsonPayload = {
  kind: 'generate';
  providerId?: TranslationProviderId;
  dryRun: boolean;
  force: boolean;
  targets: string[];
  dynamicKeySites: number;
  leavesProcessed: number;
  targetResults: GenerateTargetJsonRow[];
  /** Present when at least one target was written from a partial run (`translate.policy.onIncompleteRun`). */
  partial?: boolean;
  /** Hint for topping up leaves after a partial write (stable contract string). */
  resumeHint?: string;
  /** Sum of {@link GenerateTargetJsonRow.markedForReview} across targets written as partial in this run. */
  markedForReview?: number;
};

/**
 * Per-call options for {@link runGenerate}. **`targets`** must be resolved by the host (interactive
 * prompt or **`--target`** parse). Use **`resume`** (+ optional **`all`**) for top-up runs.
 */
export type GenerateRunOptions = {
  readonly targets: readonly string[];
  readonly dynamicKeySites: number;
  readonly source?: string;
  readonly provider?: string;
  readonly workers?: number;
  readonly englishName?: string;
  readonly nativeName?: string;
  readonly direction?: 'ltr' | 'rtl';
  readonly force?: boolean;
  readonly dryRun?: boolean;
  readonly metadata?: boolean;
  readonly noLocaleMeta?: boolean;
  /** With normal **`generate`** only: ask for editable locale meta defaults (English/native/direction). */
  readonly ask?: boolean;
  /**
   * Top-up existing locale JSON (review-eligible leaves only). Requires existing **`&lt;target&gt;.json`**.
   * Always combine with the **`--resume`** CLI flag — not a persisted config field.
   */
  readonly resume?: boolean;
  /**
   * CLI-built uncertain-prefix slice for resume eligibility; required when **`resume`** is true.
   * Omitted on normal **`generate`** runs.
   */
  readonly resumeReference?: GenerateResumeRefContext;
  /**
   * When the CLI has already read the source JSON and emitted **`read_source`**, pass it here to avoid a
   * second read and preserve **`run.progress`** ordering (**`read_source` → `resolve_targets`**).
   */
  readonly preloadedRaw?: unknown;
};

export type GenerateRunResult = {
  payload: GenerateJsonPayload;
  /** Issues owned by generate (identity streak, empty-source warnings). Host merges discovery warnings. */
  issues: Issue[];
};
