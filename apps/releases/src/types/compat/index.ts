import type { StreamId } from '../stream/index.js';

export type CompatEntry = {
  stream: StreamId;
  /** Exact version bundled or pinned at ship time */
  version?: string;
  /** Minimum compatible version (e.g. extension runtime dep) */
  minVersion?: string;
};
