import type { DynamicKeySite } from '../extractor/dynamic/index.js';
import type { KeyObservation } from '../extractor/keySites/index.js';
import type { ProjectLiteralKeyUsage } from '../extractor/projectLiteralKeyUsage.js';
import type { CacheDispatchInfo } from '../cache/index.js';
import type { OperationId, RunEmitter } from '../shared/run/index.js';

export type ProjectAnalysisCounts = {
  keyObservations: number;
  /** All dynamic inventory rows (includes commented). */
  dynamicSites: number;
  /** Runtime-relevant dynamic sites (excludes commented). */
  dynamicActive: number;
  /** Inactive dynamic sites inside comments. */
  dynamicCommented: number;
  sourceFilesScanned: number;
  missingKeys: number;
};

/** On-disk `analysis.json` payload (`data` field of the run envelope). */
export type ProjectAnalysisCacheData = {
  version: 1;
  keyObservations: KeyObservation[];
  dynamicSites: DynamicKeySite[];
  missingKeys: string[];
  counts: ProjectAnalysisCounts;
};

export type ProjectAnalysis = ProjectAnalysisCacheData & {
  usage: ProjectLiteralKeyUsage;
  cache?: CacheDispatchInfo;
};

export type ProjectAnalysisResolveOptions = {
  emit?: RunEmitter;
  op?: OperationId;
  runId?: string;
};
