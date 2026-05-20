export {
  DEFAULT_MAX_SHARE_JSON_BYTES,
  loadShareJsonFile,
  mergeDuplicateShareEntries,
  resolveShareJsonPath,
  saveShareJsonFile,
  shareJsonSerializedByteLength,
  SHARE_JSON_BASENAME,
} from './io/shareJson.js';
export type { SaveShareJsonResult } from './io/shareJson.js';
export type {
  LoadShareJsonResult,
  ShareCacheEntry,
  ShareJsonFile,
  ShareJsonHealReport,
  ShareKind,
  ShareLinks,
  WorkerShareEnvelope,
} from '../types/share/index.js';
export { parseWorkerShareEnvelope, shareRemoteIssueFromWorker } from './remote.js';
export { shareCacheEntrySchema, shareJsonFileSchema } from './schema.js';
