import type { ShareCacheEntry, ShareKind, ShareLinks } from './entry.js';
import type { ShareManifest } from './manifest.js';

export type ShareUploadJsonPayload = {
  kind: 'share';
  shareKind: ShareKind;
  action: 'uploaded' | 'skipped' | 'link-only';
  manifest?: ShareManifest;
  links: ShareLinks;
  workerIds: { projectId?: string; reportId?: string };
  skippedReason?: string;
  cacheEntry?: ShareCacheEntry;
};

export type ShareListJsonPayload = {
  kind: 'share-list';
  entries: ShareCacheEntry[];
};

export type ShareViewJsonPayload = {
  kind: 'share-view';
  shareKind: ShareKind;
  workerId: string;
  remote?: unknown;
  local?: ShareCacheEntry;
  links: ShareLinks;
};

export type ShareDeleteJsonPayload = {
  kind: 'share-delete';
  shareKind: ShareKind;
  workerId: string;
  deletedLocal: boolean;
  deletedRemote: boolean;
};
