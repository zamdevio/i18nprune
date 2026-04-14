/** Paths that always copy from source locale (no MT) — used by generate / sync. */
export type PreservePolicy = {
  copyKeys?: string[];
  copyPrefixes?: string[];
};

/** Exclusions for “still English?” / drift — used by quality / fill. */
export type ParityPolicy = {
  excludeKeys?: string[];
  excludePrefixes?: string[];
  excludeValues?: string[];
};

export type Policies = {
  preserve?: PreservePolicy;
  parity?: ParityPolicy;
};

/** Default format for **`--report-file`** when **`--report-format`** is omitted. */
export type ReportFileFormat = 'json' | 'text' | 'csv';

/** Optional settings for the **`validate`** command. Unknown keys are allowed at runtime (schema uses passthrough). */
export type ValidateCommandConfig = Record<string, unknown>;

/**
 * Optional settings for the **`missing`** command.
 * Env **`MISSING_DISPLAY_DEFAULT_TOP`** overrides **`displayDefaultTop`** when set to a valid positive integer.
 */
export type MissingCommandConfig = {
  /** Default cap for human path listings when the CLI omits `--top` (still overridden by `--full-list`). */
  displayDefaultTop?: number;
};

export type { ReferenceConfig, ReferenceDefaults, ReferenceCommandOverrides, EffectiveReferenceConfig } from '@/types/config/reference.js';
export type {
  UncertainKeyPolicy,
  StringPresencePolicy,
  ReferenceCommands,
} from '@/types/config/reference.js';

/** Resolved i18nprune config from `.ts` / `.js` (defaults when file missing). */
export type I18nPruneConfig = {
  source: string;
  localesDir: string;
  src: string;
  functions: string[];
  /** Optional label for the source locale in user-facing messages (defaults to basename of `source`). */
  sourceLocaleCode?: string;
  /** Default artifact format for global **`--report-file`** (CLI **`--report-format`** overrides). */
  reportFormat?: ReportFileFormat;
  policies?: Policies;
  /**
   * Key-resolution semantics: literal vs uncertain evidence, ripgrep string presence, per-command overrides.
   */
  reference?: import('@/types/config/reference.js').ReferenceConfig;
  /** Namespace for **`validate`** command options (stable extension point for CI and tooling). */
  validate?: ValidateCommandConfig;
  /** Namespace for **`missing`** command options. */
  missing?: MissingCommandConfig;
};
