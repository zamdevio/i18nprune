export type IssueSeverity = 'error' | 'warning' | 'info';

/** Structured finding for automation (CLI `--json` envelope `issues[]`, library `Result`). */
export type Issue = {
  severity: IssueSeverity;
  /** Stable machine id, e.g. `i18nprune.missing_source_locale`. */
  code: string;
  message: string;
  path?: string;
  /**
   * Legacy: path under the repo **`docs/`** tree (no leading slash), e.g. `docs/commands/validate/README`.
   * Prefer **`docHref`** for stable links to the published docs site.
   */
  docPath?: string;
  /** Full HTTPS URL to the documented issue section (e.g. `docs/issues/scan#…`). */
  docHref?: string;
};

export type ResultMeta = {
  /** Envelope contract version (same value as `RESULT_API_VERSION` in `constants/result.ts`). */
  apiVersion: string;
  schemaVersion?: string;
  cwd?: string;
};

/**
 * Unified CLI / library JSON envelope: domain outcome in `ok`, payload in `data`.
 * CLI `--json` mode always serializes this shape; operation-specific payload fields live in `data`.
 */
export type CliJsonEnvelope<K extends string, D> = {
  ok: boolean;
  kind: K;
  data: D;
  issues: Issue[];
  meta: ResultMeta;
};

/** Discriminated success variant for programmatic APIs (no `data` on failure). */
export type OkResult<K extends string, D> = {
  ok: true;
  kind: K;
  data: D;
  issues: Issue[];
  meta: ResultMeta;
};

export type ErrResult = {
  ok: false;
  kind: 'failed';
  issues: Issue[];
  meta: ResultMeta;
};

export type Result<K extends string, D> = OkResult<K, D> | ErrResult;
