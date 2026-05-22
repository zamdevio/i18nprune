import type { NormalizedProjectConfig } from './config.js';
import type { ProjectSnapshot } from './upload.js';
import type { ArchiveProjectFs } from './archiveFs.js';

export type FillProjectSnapshotExtractionInput = {
  snapshot: ProjectSnapshot;
  textFiles: Record<string, string>;
  fs: ArchiveProjectFs;
  configOverride?: string;
};

export type FillProjectSnapshotExtractionResult =
  | { ok: true; normalized: NormalizedProjectConfig; extractionStartedAt: string; computedAt: string }
  | { ok: false; code: string; message: string };
