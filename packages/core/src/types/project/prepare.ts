import type { Issue } from '../json/envelope/index.js';
import type { ParsedProjectUpload, ProjectSnapshot } from './upload.js';

/** Wire format version for `POST /v1/projects` prepared snapshot ingest. */
export const HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION = 1 as const;

/** High-resolution prepare timings (measured where {@link prepareProjectSnapshotFromArchive} runs). */
export type ProjectPrepareMeta = {
  prepareHost?: string;
  zipParsedMs?: number;
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
