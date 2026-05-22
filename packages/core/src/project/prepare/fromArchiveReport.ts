import { ISSUE_SHARE_PREPARE_REPORT_FROM_ARCHIVE_FAILED } from '../../shared/constants/issueCodes.js';
import type { Issue } from '../../types/json/envelope/index.js';
import type { PrepareProjectSnapshotFromArchiveInput } from '../../types/project/prepareArchive.js';
import type { ValidateReportIngestResult } from '../../types/report/ingest.js';
import { prepareProjectSnapshotFromArchive } from './fromArchive.js';
import { buildReportDocumentFromPreparedSnapshot } from './fromAnalysis.js';
import { prepareReportPayload } from './report.js';

function toIssue(code: string, message: string): Issue {
  return { severity: 'error', code, message };
}

/**
 * Zip secondary mode for reports: reuse project archive prepare, then build report document from snapshot extraction.
 */
export async function prepareReportFromArchive(
  input: PrepareProjectSnapshotFromArchiveInput,
): Promise<ValidateReportIngestResult | { ok: false; issues: Issue[] }> {
  const project = await prepareProjectSnapshotFromArchive(input);
  if (!project.ok) return project;

  let document: Record<string, unknown>;
  try {
    document = buildReportDocumentFromPreparedSnapshot(project.parsed.snapshot, {
      cwd: '/',
      toolVersion: 'unknown',
      environment: {
        platform: 'linux',
        arch: 'x64',
        nodeVersion: 'v0.0.0',
        osRelease: '0',
        runtimeFamily: 'linux',
      },
    });
  } catch (err) {
    return {
      ok: false,
      issues: [
        toIssue(
          ISSUE_SHARE_PREPARE_REPORT_FROM_ARCHIVE_FAILED,
          err instanceof Error ? err.message : 'Failed to build report from archive snapshot',
        ),
      ],
    };
  }

  return prepareReportPayload({ reportDocument: document });
}
