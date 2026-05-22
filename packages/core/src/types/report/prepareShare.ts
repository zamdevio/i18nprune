import type { CoreContext } from '../context/index.js';
import type { ProjectAnalysis } from '../analysis/index.js';
import type { ReportHostHooks } from './reportRun.js';

export type PrepareReportForShareInput = {
  ctx: CoreContext;
  host: ReportHostHooks;
  /** When set, skips a second project analysis resolve (combined share prepare). */
  analysis?: ProjectAnalysis;
};
