export type RecentProjectZipEntry = {
  id: string;
  name: string;
  size: number;
  createdAt: number;
  /** Content hash of the zip bytes (SHA-256 hex); used for dedupe and duplicate detection. */
  sha256?: string;
};

export type RecentProjectZipSettings = {
  enabled: boolean;
  maxCount: number;
  defaultMode: 'ask' | 'local' | 'remote';
  maxTotalMb: number;
};

/** Root `manifest.json` for Settings zip-cache export/import (version must be `1`). */
export type RecentProjectZipBundleManifest = {
  version: 1;
  exportedAt: string;
  settings: RecentProjectZipSettings;
  items: RecentProjectZipBundleManifestItem[];
};

export type RecentProjectZipBundleManifestItem = RecentProjectZipEntry & { sha256: string };
