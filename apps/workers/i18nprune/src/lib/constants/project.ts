import { PROJECT_UPLOAD_ZIP_LIMITS } from '@i18nprune/core';

export const PROJECT_LIMITS = {
  ...PROJECT_UPLOAD_ZIP_LIMITS,
  // -1 means "store full cached previews" (no truncation at upload time).
  maxCachedPreviewItems: -1,
} as const;
