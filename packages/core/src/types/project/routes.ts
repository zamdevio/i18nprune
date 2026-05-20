import type { ProjectWorkerConfigBody } from './config.js';

export type ProjectWorkerMissingBody = ProjectWorkerConfigBody & {
  targetTag?: string;
  reportMissingPaths?: string[];
};

export type ProjectWorkerReportBody = {
  configJson?: unknown;
  config?: unknown;
  configOverrides?: unknown;
};
