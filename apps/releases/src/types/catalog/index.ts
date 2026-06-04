import type { ReleaseRecordV1 } from '../release/index.js';
import type { StreamId } from '../stream/index.js';

export type StreamCatalog = {
  latest: string | null;
  versions: string[];
  releases: Record<string, ReleaseRecordV1>;
};

export type ReleaseCatalogV1 = {
  schemaVersion: 1;
  generatedAt: string;
  streams: Record<StreamId, StreamCatalog>;
};
