export {
  PROJECT_REPORT_KIND,
  PROJECT_REPORT_SCHEMA_VERSION,
  REPORT_INLINE_PAYLOAD_PLACEHOLDER,
} from '../constants/report.js';
export { projectReportDocumentSchema, type ParsedProjectReportDocument } from './schema.js';
export type {
  ProjectReportDocument,
  ProjectReportEnvironment,
  ProjectReportProjectMeta,
  ProjectReportSummary,
} from './types.js';
