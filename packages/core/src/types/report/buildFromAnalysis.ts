import type { CoreContext } from '../context/index.js';
import type { ProjectAnalysis } from '../analysis/index.js';
import type { ReportEnvironmentSnapshot } from './reportDocument.js';

export type BuildReportDocumentFromAnalysisInput = {
  ctx: CoreContext;
  analysis: ProjectAnalysis;
  environment: ReportEnvironmentSnapshot;
  cwd: string;
  toolVersion: string;
};
