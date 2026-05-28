import type { HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION } from '../../../shared/constants/project.js';
import type { ProjectAnalysisResolveOptions } from '../../analysis/index.js';
import type { CoreContext } from '../../context/index.js';
import type { Issue } from '../../json/envelope/index.js';
import type { RuntimePathPort } from '../../runtime/path.js';
import type { HostedIngestProcessorContext, HostPrepareCacheMeta } from '../metadata.js';
import type { ParsedProjectUpload, ProjectSnapshot } from '../upload.js';

/** High-resolution prepare timings (measured where prepare runs on the host). */
export type ProjectPrepareMeta = {
  prepareHost?: string;
  zipParsedMs?: number;
  analysisMs?: number;
  extractionMs?: number;
  totalMs?: number;
  /** Measured DO persist on worker ingest (ms). */
  persistMs?: number;
  /** Host project-cache dispatch at prepare time (CLI/web/SDK). */
  hostCache?: HostPrepareCacheMeta;
};

/** Primary worker ingest body: prepared snapshot from core (CLI / web / edge zip mode). */
export type HostedProjectIngestEnvelope = {
  schemaVersion: typeof HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION;
  snapshot: ProjectSnapshot;
  prepareMeta?: ProjectPrepareMeta;
  /** Host SDK context (CLI / web); omitted on worker-only archive uploads. */
  processorContext?: HostedIngestProcessorContext;
  /** When true, worker stores payload even if content hash already exists (replaces prior row). */
  force?: boolean;
};

export type PrepareProjectSnapshotResult =
  | { ok: true; parsed: ParsedProjectUpload; prepareMeta: ProjectPrepareMeta }
  | { ok: false; issues: Issue[] };

export type ValidateHostedProjectIngestResult =
  | { ok: true; envelope: HostedProjectIngestEnvelope }
  | { ok: false; issues: Issue[] };

export type PrepareTimerMark = 'zipParsed' | 'analysisDone' | 'extractionDone';

export type PrepareTimer = {
  mark(label: PrepareTimerMark): void;
  finish(prepareHost?: string): ProjectPrepareMeta;
};

export type PrepareHostKind = 'cli-share' | 'web' | 'worker-archive';

export type PrepareHostPolicy = {
  prepareHost: PrepareHostKind;
  useAnalysisCache: boolean;
};

export type PrepareProjectSnapshotFromRootInput = {
  ctx: CoreContext;
  projectRoot: string;
  projectId: string;
  projectHash: string;
  prepareHost?: PrepareHostKind;
  requestReceivedAt?: string;
  analysisOpts?: Pick<ProjectAnalysisResolveOptions, 'emit' | 'runId'>;
};

export type PrepareProjectSnapshotFromArchiveInput = {
  projectId: string;
  projectHash: string;
  zipBytes: Uint8Array;
  path: RuntimePathPort;
  configJson?: string;
  prepareHost?: PrepareHostKind;
  requestReceivedAt?: string;
};
