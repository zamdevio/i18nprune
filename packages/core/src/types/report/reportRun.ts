import type { Issue } from '../json/envelope/index.js';
import type { RunEmitter } from '../shared/run/index.js';
import type { ReportEnvironmentSnapshot } from './reportDocument.js';

/**
 * Per-call options for {@link runReport}.
 *
 * @remarks
 * When `source` is `'file'`, the host reads and validates the JSON file
 * externally (e.g. via `@i18nprune/core/report-schema`) and passes the
 * parsed object as `preloadedDocument`. Core never touches the filesystem
 * for `--from` files.
 */
export type ReportRunOptions = {
  /** `'project'` scans live source files; `'file'` uses a pre-loaded report JSON. */
  source: 'project' | 'file';
  /**
   * Pre-parsed document for `source: 'file'`.
   * Must match `ProjectReportDocument` shape from `@i18nprune/core/report-schema`.
   */
  preloadedDocument?: unknown;
};

/**
 * Host-supplied environment facts and callbacks for the report operation.
 *
 * The CLI fills these from `process.*`, `os.*`, and cache infrastructure.
 * SDK consumers and other hosts can substitute test doubles.
 *
 * @remarks Follows the same injection pattern as {@link DoctorHostHooks}
 * and {@link ValidateHostHooks}: core never probes the runtime directly.
 */
export type ReportHostHooks = {
  /** Event emitter for `run.*` progress. */
  emit: RunEmitter;
  /** Unique run identifier for event correlation. */
  runId: string;
  /** Host environment snapshot (platform, arch, Node version, OS release). */
  environment: ReportEnvironmentSnapshot;
  /** Host working directory (used as `project.cwd` in the document). */
  cwd: string;
  /** CLI/tool version string embedded in the report metadata. */
  toolVersion: string;
};

/**
 * JSON `data` shape for the `report` envelope.
 *
 * The `document` field matches `ProjectReportDocument` from `@i18nprune/core/report-schema`,
 * typed loosely as `Record<string, unknown>` so core does not depend on the
 * report package at the type level.
 */
export type ReportJsonPayload = {
  kind: 'report';
  /** Full project report document (same structure as `report --format json` output). */
  document: Record<string, unknown>;
};

/**
 * Result returned by {@link runReport}.
 *
 * Contains the structured payload, computed issues, and the dynamic-sites
 * count (used by the CLI for human-readable warnings).
 */
export type ReportRunResult = {
  /** Structured data for the JSON envelope. */
  payload: ReportJsonPayload;
  /** Issues discovered during the report build (e.g. dynamic key sites). */
  issues: Issue[];
  /** Number of dynamic (non-literal) key call sites found. */
  dynamicSitesCount: number;
};
