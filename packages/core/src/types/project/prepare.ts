import type { HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION } from '../../shared/constants/project.js';
import type { Issue } from '../json/envelope/index.js';
import type { ParsedProjectUpload, ProjectSnapshot } from './upload.js';

/** High-resolution prepare timings (measured where prepare runs on the host). */
export type ProjectPrepareMeta = {
  prepareHost?: string;
  zipParsedMs?: number;
  analysisMs?: number;
  extractionMs?: number;
  totalMs?: number;
};

/** Primary worker ingest body: prepared snapshot from core (CLI / web / edge zip mode). */
export type HostedProjectIngestEnvelope = {
  schemaVersion: typeof HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION;
  snapshot: ProjectSnapshot;
  prepareMeta?: ProjectPrepareMeta;
};

export type PrepareProjectSnapshotResult =
  | { ok: true; parsed: ParsedProjectUpload; prepareMeta: ProjectPrepareMeta }
  | { ok: false; issues: Issue[] };

export type ValidateHostedProjectIngestResult =
  | { ok: true; envelope: HostedProjectIngestEnvelope }
  | { ok: false; issues: Issue[] };
