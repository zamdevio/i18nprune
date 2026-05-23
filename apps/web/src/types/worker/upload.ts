import type { Issue } from '@i18nprune/core';

export type ProjectIngestMode = 'prepared' | 'archive';

export type ProjectUploadMeta = {
  preparedAt?: string;
  extractionComputedAt?: string;
};

export type ProjectUploadResult =
  | { ok: true; projectId: string; uploadMeta: ProjectUploadMeta; deduped?: boolean }
  | { ok: false; issue: Issue };
