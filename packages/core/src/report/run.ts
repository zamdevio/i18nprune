import type { CoreContext } from '../types/generate/index.js';
import type {
  ReportHostHooks,
  ReportJsonPayload,
  ReportRunOptions,
  ReportRunResult,
} from '../types/report/index.js';
import type { Issue } from '../types/json/envelope/index.js';
import { ISSUE_SCAN_DYNAMIC_KEY_SITES } from '../shared/constants/issueCodes.js';
import { issueCodeRepoDocPathForIssueCode } from '../shared/docs/issueAnchors.js';
import { buildReportDocument } from './build.js';

/**
 * Core entry for the `report` operation.
 *
 * Builds a `ProjectReportDocument` from live project analysis (or accepts a
 * pre-loaded document when `opts.source` is `'file'`), computes issues, and
 * returns a structured result. File writing and format rendering are host
 * concerns — core only produces the data payload.
 *
 * @param ctx  - Core context providing resolved project paths, config, and adapters.
 * @param opts - Run options: `source` selects live scan vs pre-loaded document.
 * @param host - Host-supplied environment facts, event emitter, and metadata.
 * @returns Structured `{ payload, issues, dynamicSitesCount }`.
 *
 * @remarks Pure orchestration: no `process.*` access, no file writes.
 * Environment facts arrive via `host`; filesystem access uses `ctx.adapters.fs`.
 *
 * @example
 * ```ts
 * const result = runReport(ctx, { source: 'project' }, {
 *   emit: emitter,
 *   runId: 'r1',
 *   environment: { platform: 'linux', arch: 'x64', nodeVersion: 'v20.0.0', osRelease: '6.6', runtimeFamily: 'linux' },
 *   cwd: '/my/project',
 *   toolVersion: '0.1.0',
 * });
 * ```
 */
export function runReport(
  ctx: CoreContext,
  opts: ReportRunOptions,
  host: ReportHostHooks,
): ReportRunResult {
  let document: Record<string, unknown>;
  let dynamicSitesCount: number;

  if (opts.source === 'file' && opts.preloadedDocument !== undefined) {
    document = opts.preloadedDocument as Record<string, unknown>;
    const details = document.details as Record<string, unknown> | undefined;
    const dynamicSitesRaw = details?.dynamicSites as unknown[] | undefined;
    dynamicSitesCount = Array.isArray(dynamicSitesRaw) ? dynamicSitesRaw.length : 0;
  } else {
    const built = buildReportDocument(ctx, {
      environment: host.environment,
      cwd: host.cwd,
      toolVersion: host.toolVersion,
      emit: host.emit,
      runId: host.runId,
    });
    document = built.document;
    dynamicSitesCount = built.dynamicSitesCount;
  }

  const issues = buildReportIssues(ctx, dynamicSitesCount);
  const payload: ReportJsonPayload = { kind: 'report', document };

  return { payload, issues, dynamicSitesCount };
}

function buildReportIssues(_ctx: CoreContext, dynamicSitesCount: number): Issue[] {
  const issues: Issue[] = [];

  if (dynamicSitesCount > 0) {
    issues.push({
      severity: 'warning',
      code: ISSUE_SCAN_DYNAMIC_KEY_SITES,
      message: `${String(dynamicSitesCount)} translation call(s) use a non-literal key — static analysis cannot enumerate computed keys as fixed paths.`,
      docPath: issueCodeRepoDocPathForIssueCode(ISSUE_SCAN_DYNAMIC_KEY_SITES),
    });
  }

  return issues;
}
