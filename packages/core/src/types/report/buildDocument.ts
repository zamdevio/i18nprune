import type { ReportEnvironmentSnapshot } from './reportDocument.js';
import type { RunEmitter } from '../shared/run/index.js';

export type BuildReportDocumentInput = {
  environment: ReportEnvironmentSnapshot;
  cwd: string;
  toolVersion: string;
  emit?: RunEmitter;
  runId?: string;
};
