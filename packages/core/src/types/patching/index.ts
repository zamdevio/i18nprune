import type { RuntimeFsPort, RuntimePathPort } from '../runtime/index.js';

/** Supported auto-patch recipe (today: lazy **`loader_generated`** bundle). */
export type PatchingRecipeId = 'loader_generated';

/** Commands that may trigger patching side effects after locale writes. */
export type PatchingCommandName = 'generate' | 'sync' | 'locales-edit' | 'locales-delete';

/** Whether patching is upserting locale rows or removing them from generated config. */
export type PatchingAction = 'upsert_locales' | 'delete_locales';

/**
 * **`warn_skip`** — log/skip on analyzer issues; **`strict`** — fail the run when auto-patch preconditions break.
 */
export type PatchingMode = 'warn_skip' | 'strict';

/** User-facing **`patching`** block in **`i18nprune` config** (optional; default off). */
export type PatchingConfigInput = {
  /** Master switch: when **`false`** or omitted, **`patch`** / **`--patch`** no-op aside from diagnostics. */
  enabled?: boolean;
  /** Which patch strategy to run (only **`loader_generated`** today). */
  recipe?: PatchingRecipeId;
  /** Path to the CLI-owned generated loader module (typically `src/i18n/loaders.generated.ts`). */
  loaderPath?: string;
  /** App-owned **`config.json`** (or similar) listing locale codes for the loader. */
  configPath?: string;
  /**
   * Directory of locale `*.json` files, expressed **relative to the directory that contains your
   * `i18nprune` config file** (the CLI passes that as `projectRoot`, usually the repo root). Use the same path
   * segment as top-level **`localesDir`** when locales live beside **`src`** — typically **`locales`**.
   *
   * **`import()` inside `loaders.generated.ts`** is always rewritten as a path **relative to the directory
   * containing `loaderPath`** (e.g. **`../../locales`** when **`loaders.generated.ts`** sits under **`src/i18n/`**
   * and **`localeJsonImportBase`** is **`locales`** at repo root). You configure the locales root here; core
   * derives the literal import prefix automatically.
   *
   * Hosts/tests that omit **`projectRoot`** resolve this segment **relative to `loaderPath`’s directory** instead.
   */
  localeJsonImportBase?: string;
  /** Max bytes read per patched file before skipping (guard against huge accidental paths). */
  sizeLimitBytes?: number;
  /** Analyzer / applier strictness when preconditions fail. */
  mode?: PatchingMode;
};

export type ResolvedPatchingConfig = {
  enabled: boolean;
  recipe: PatchingRecipeId;
  loaderPath: string;
  configPath: string;
  localeJsonImportBase: string;
  sizeLimitBytes: number;
  mode: PatchingMode;
};

export type PatchingSkipReason =
  | 'disabled'
  | 'missing_path'
  | 'not_found'
  | 'not_file'
  | 'too_large'
  | 'unsupported_pattern'
  | 'parse_error'
  | 'no_changes'
  | 'apply_failed'
  | 'strict_mode_failure';

export type PatchingDiagnostic = {
  severity: 'info' | 'warn' | 'error';
  code: string;
  message: string;
  docPath?: string;
  path?: string;
};

export type LocaleDirection = 'ltr' | 'rtl';

export type PatchingLocaleRecord = {
  code: string;
  englishName: string;
  nativeName: string;
  direction: LocaleDirection;
  [extra: string]: unknown;
};

export type PatchingAnalyzeOutput = {
  config: ResolvedPatchingConfig;
  localeRecords: PatchingLocaleRecord[];
  configOnlyCodes: string[];
  fileOnlyCodes: string[];
  diagnostics: PatchingDiagnostic[];
  hasError: boolean;
  canAutoPatch: boolean;
};

export type PatchingFileEdit = {
  path: string;
  before: string;
  after: string;
  kind: 'loader' | 'config' | 'generated';
};

export type PatchingPlan = {
  recipe: PatchingRecipeId;
  action: PatchingAction;
  changedLocaleCodes: string[];
  edits: PatchingFileEdit[];
};

export type PatchingRuntimePorts = {
  fs: RuntimeFsPort;
  path: RuntimePathPort;
};

export type PatchingRunInput = {
  command: PatchingCommandName;
  action: PatchingAction;
  changedLocaleCodes: string[];
  /** Optional records for upsert operations that need exact metadata rather than catalog defaults. */
  upsertLocaleRecords?: readonly PatchingLocaleRecord[];
  sourceLocaleCode?: string;
  config?: PatchingConfigInput;
  runtime: PatchingRuntimePorts;
  /**
   * Root for resolving relative **`configPath`**, **`loaderPath`**, and **`localeJsonImportBase`** (directory of
   * **`i18nprune.config.*`** in normal CLI runs). Unit tests may omit and resolve **`localeJsonImportBase`**
   * from **`loaderPath`**’s directory instead.
   */
  projectRoot?: string;
  /**
   * When **`true`**, completeness checks behave as if **`--patch`** forced a patching run
   * (e.g. **doctor** with global **`--patch`** even if **`patching.enabled`** is false).
   */
  treatAsPatchRequested?: boolean;
};

export type PatchingResult = {
  ok: boolean;
  applied: boolean;
  skipped: boolean;
  recipe?: PatchingRecipeId;
  action?: PatchingAction;
  changedFiles: string[];
  skipReason?: PatchingSkipReason;
  diagnostics: PatchingDiagnostic[];
};
