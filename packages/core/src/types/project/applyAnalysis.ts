import type { CoreContext } from '../context/index.js';
import type { ProjectAnalysis } from '../analysis/index.js';
import type { NormalizedProjectConfig } from './config.js';
import type { ProjectSnapshot } from './upload.js';

export type ApplyProjectAnalysisInput = {
  snapshot: ProjectSnapshot;
  textFiles: Record<string, string>;
  analysis: ProjectAnalysis;
  normalized: NormalizedProjectConfig;
  ctx: CoreContext;
  projectRoot: string;
};
