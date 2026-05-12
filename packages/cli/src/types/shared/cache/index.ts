import type { CacheDispatchInfo } from '@i18nprune/core';
import type { ProjectReportDocument } from '@/types/command/report/index.js';

export type ProjectReportCacheResult = {
  document: ProjectReportDocument;
  cache: CacheDispatchInfo;
};

export type ProjectReportDataMemo = {
  document: ProjectReportDocument;
  fromCache: boolean;
};
