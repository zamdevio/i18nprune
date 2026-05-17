/**
 * Project workspace readiness: cheap preflight checks shared by CLI, IDE, and SDK hosts.
 */
import type { Issue } from '../json/envelope/index.js';

/** Named bundles aligned with common CLI entrypoints; hosts may also pass {@link ProjectReadinessChecks}. */
export type ProjectReadinessCliPreset =
  | 'validate'
  | 'quality'
  | 'sync'
  | 'missing'
  | 'review'
  | 'report'
  | 'cleanup'
  | 'generate'
  | 'locales-list'
  | 'locales-dynamic'
  | 'locales-delete'
  | 'config'
  | 'patch'
  | 'init'
  | 'doctor';

/**
 * Fine-grained checks. Set a field to **true** to run that check. Omitted / false = skip.
 * IDE and SDK callers compose these directly; CLI usually passes a {@link ProjectReadinessCliPreset}.
 */
export type ProjectReadinessChecks = {
  /** Require an on-disk **`i18nprune.config.*`** (not defaults-only); uses **`CoreContext.configFileLoaded`**. */
  configFilePresent?: boolean;
  /** `paths.sourceLocale` exists, is a file, and contains parseable JSON. */
  sourceLocaleJsonReadable?: boolean;
  /** Same as {@link sourceLocaleJsonReadable} plus root value must be a plain object (not array / null). */
  sourceLocaleJsonObject?: boolean;
  /** `paths.localesDir` exists and is a directory; directory listing must succeed. */
  localesDirectoryAccessible?: boolean;
  /** `paths.srcRoot` exists and is a directory. */
  srcRootDirectory?: boolean;
  /**
   * When `locales.mode` is `locale_directory`, require explicit `locales.structure`
   * (`locale_per_dir` or `feature_bundle`) — layout resolution does not guess.
   */
  localesStructureRequired?: boolean;
};

export type ProjectReadinessRequest =
  | { mode: 'preset'; preset: ProjectReadinessCliPreset }
  | { mode: 'custom'; checks: ProjectReadinessChecks };

export type ProjectReadinessResult = {
  ok: boolean;
  issues: Issue[];
};
