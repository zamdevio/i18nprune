import type { RuntimePathPort } from '../runtime/path.js';
import type { PrepareHostKind } from './prepareHost.js';

export type PrepareProjectSnapshotFromArchiveInput = {
  projectId: string;
  projectHash: string;
  zipBytes: Uint8Array;
  path: RuntimePathPort;
  configJson?: string;
  prepareHost?: PrepareHostKind;
  requestReceivedAt?: string;
};
