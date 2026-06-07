export { archiveHostedReportEnvironment } from './archiveEnvironment.js';
export { buildReportDocument } from './build.js';
export {
  injectJsonIntoPayloadScript,
  renderReportHtml,
  resolveReportSpaTemplatePath,
} from './html.js';
export { runReport } from './run.js';
export type { ReportHtmlRenderOptions } from './html.js';
export type {
  BuildReportDocumentInput,
  ReportEnvironmentSnapshot,
  ReportHostHooks,
  ReportJsonPayload,
  ReportRunOptions,
  ReportRunResult,
} from '../types/report/index.js';
