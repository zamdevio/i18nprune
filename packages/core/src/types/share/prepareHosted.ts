import type { CoreContext } from '../context/index.js';
import type { Issue } from '../json/envelope/index.js';
import type { ProjectAnalysis } from '../analysis/index.js';
import type { ProjectAnalysisResolveOptions } from '../analysis/index.js';
import type { PrepareHostKind, PrepareProjectSnapshotResult, ProjectPrepareMeta } from '../project/prepare/index.js';
import type { ReportEnvironmentSnapshot } from '../report/reportDocument.js';
import type { ValidateReportIngestResult } from '../report/ingest.js';

export type PrepareShareHostedInput = {
  ctx: CoreContext;
  projectRoot: string;
  projectId: string;
  projectHash: string;
  wantProject: boolean;
  wantReport: boolean;
  prepareHost?: PrepareHostKind;
  requestReceivedAt?: string;
  analysisOpts?: Pick<ProjectAnalysisResolveOptions, 'emit' | 'runId'>;
  reportHost?: {
    environment: ReportEnvironmentSnapshot;
    cwd: string;
    toolVersion: string;
  };
};

export type PrepareShareHostedResult =
  | {
      ok: true;
      prepareMeta: ProjectPrepareMeta;
      project?: PrepareProjectSnapshotResult & { ok: true };
      report?: ValidateReportIngestResult & { ok: true };
      analysis?: ProjectAnalysis;
    }
  | { ok: false; issues: Issue[] };
