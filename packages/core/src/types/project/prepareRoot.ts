import type { CoreContext } from '../context/index.js';
import type { ProjectAnalysisResolveOptions } from '../analysis/index.js';
import type { PrepareHostKind } from './prepareHost.js';

export type PrepareProjectSnapshotFromRootInput = {
  ctx: CoreContext;
  projectRoot: string;
  projectId: string;
  projectHash: string;
  prepareHost?: PrepareHostKind;
  requestReceivedAt?: string;
  analysisOpts?: Pick<ProjectAnalysisResolveOptions, 'emit' | 'runId'>;
};
