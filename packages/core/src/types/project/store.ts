import type { ProjectSnapshot } from './upload.js';

/** Durable Object row for a cached worker project upload. */
export type ProjectStoreRow = {
  projectId: string;
  projectHash: string;
  snapshot: ProjectSnapshot;
  /** ISO timestamp — updated on upload and successful reads; drives idle eviction. */
  lastAccessedAt?: string;
};
