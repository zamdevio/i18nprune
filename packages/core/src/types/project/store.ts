import type { HostedIngestProcessorContext } from './metadata.js';
import type { IngestRouteKind } from './metadata.js';
import type { ProjectPrepareMeta } from './prepare.js';
import type { ProjectSnapshot } from './upload.js';

/** Durable Object row for a cached worker project upload. */
export type ProjectStoreRow = {
  projectId: string;
  projectHash: string;
  snapshot: ProjectSnapshot;
  /** Primary JSON ingest vs worker `/archive` prepare. */
  ingestRoute: IngestRouteKind;
  /** Host or edge prepare timings (from ingest envelope or archive prepare). */
  prepareMeta?: ProjectPrepareMeta;
  /** Host machine / SDK context when provided on JSON ingest. */
  processorContext?: HostedIngestProcessorContext;
  /** ISO timestamp — updated on upload and successful reads; drives idle eviction. */
  lastAccessedAt?: string;
};
