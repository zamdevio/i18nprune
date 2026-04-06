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
};
