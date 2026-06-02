import {
  ISSUE_PROJECT_UPLOAD_CONFIG_REQUIRED,
  ISSUE_SHARE_PREPARE_ANALYSIS_FAILED,
  ISSUE_SHARE_PREPARE_NOTHING_REQUESTED,
  ISSUE_SHARE_PREPARE_REPORT_HOST_REQUIRED,
} from '../../shared/constants/issueCodes.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { PrepareProjectSnapshotResult } from '../../types/project/prepare/index.js';
import type { ParsedProjectUpload } from '../../types/project/upload.js';
import type { PrepareShareHostedInput, PrepareShareHostedResult } from '../../types/share/prepareHosted.js';
import { normalizeProjectConfig } from '../normalizeConfig.js';
import {
  applyProjectAnalysisToSnapshot,
  buildReportDocumentFromAnalysis,
  resolveShareProjectAnalysis,
} from './fromAnalysis.js';
import { prepareProjectSnapshotFromRoot } from './fromRoot.js';
import { buildProjectSnapshotShellFromContext } from './snapshotShell.js';
import { validateReportIngest } from './reportIngest.js';
import { createPrepareTimer } from './timing.js';

function toIssue(code: string, message: string): Issue {
  return { severity: 'error', code, message };
}

/**
 * One analysis pass when both project snapshot and report document are needed (CLI `--project` + `--report`).
 */
export async function prepareShareHostedFromContext(
  input: PrepareShareHostedInput,
): Promise<PrepareShareHostedResult> {
  if (!input.wantProject && !input.wantReport) {
    return {
      ok: false,
      issues: [toIssue(ISSUE_SHARE_PREPARE_NOTHING_REQUESTED, 'At least one of wantProject or wantReport must be true')],
    };
  }

  if (input.wantProject && !input.wantReport) {
    const project = await prepareProjectSnapshotFromRoot(input);
    if (!project.ok) return { ok: false, issues: project.issues };
    return { ok: true, prepareMeta: project.prepareMeta, project };
  }

  if (!input.wantProject && input.wantReport) {
    if (!input.reportHost) {
      return {
        ok: false,
        issues: [toIssue(ISSUE_SHARE_PREPARE_REPORT_HOST_REQUIRED, 'reportHost is required when preparing a report')],
      };
    }
    const analysis = resolveShareProjectAnalysis(input.ctx, {
      emit: input.analysisOpts?.emit,
      runId: input.analysisOpts?.runId,
      op: 'share',
    });
    const built = buildReportDocumentFromAnalysis({
      ctx: input.ctx,
      analysis,
      environment: input.reportHost.environment,
      cwd: input.reportHost.cwd,
      toolVersion: input.reportHost.toolVersion,
    });
    const report = await validateReportIngest({ reportDocument: built.document });
    if (!report.ok) return { ok: false, issues: report.issues };
    return {
      ok: true,
      prepareMeta: { prepareHost: input.prepareHost ?? 'cli-share', totalMs: 0 },
      report,
      analysis,
    };
  }

  const host = input.prepareHost ?? 'cli-share';
  if (!input.reportHost) {
    return {
      ok: false,
      issues: [toIssue(ISSUE_SHARE_PREPARE_REPORT_HOST_REQUIRED, 'reportHost is required when preparing a report')],
    };
  }

  const timer = createPrepareTimer();
  const shell = buildProjectSnapshotShellFromContext({
    ctx: input.ctx,
    projectRoot: input.projectRoot,
    projectId: input.projectId,
    projectHash: input.projectHash,
  });
  if (!shell.ok) return { ok: false, issues: shell.issues };

  const { snapshot, textFiles } = shell.parsed;
  if (input.requestReceivedAt) snapshot.requestReceivedAt = input.requestReceivedAt;

  const normalized = normalizeProjectConfig(snapshot.resolvedConfig);
  if (!normalized) {
    return {
      ok: false,
      issues: [
        toIssue(
          ISSUE_PROJECT_UPLOAD_CONFIG_REQUIRED,
          'Config required with locales.source, locales.directory, src, and functions[].',
        ),
      ],
    };
  }

  timer.mark('zipParsed');
  const analysis = resolveShareProjectAnalysis(input.ctx, {
    emit: input.analysisOpts?.emit,
    runId: input.analysisOpts?.runId,
    op: 'share',
  });
  timer.mark('analysisDone');

  try {
    await applyProjectAnalysisToSnapshot({
      snapshot,
      textFiles,
      analysis,
      normalized,
      ctx: input.ctx,
      projectRoot: input.projectRoot,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to apply project analysis to snapshot';
    return { ok: false, issues: [toIssue(ISSUE_SHARE_PREPARE_ANALYSIS_FAILED, message)] };
  }
  timer.mark('extractionDone');

  const project: PrepareProjectSnapshotResult & { ok: true } = {
    ok: true,
    parsed: shell.parsed as ParsedProjectUpload,
    prepareMeta: timer.finish(host),
  };

  const built = buildReportDocumentFromAnalysis({
    ctx: input.ctx,
    analysis,
    environment: input.reportHost.environment,
    cwd: input.reportHost.cwd,
    toolVersion: input.reportHost.toolVersion,
  });
  const report = await validateReportIngest({ reportDocument: built.document });
  if (!report.ok) return { ok: false, issues: report.issues };

  return {
    ok: true,
    prepareMeta: project.prepareMeta,
    project,
    report,
    analysis,
  };
}
