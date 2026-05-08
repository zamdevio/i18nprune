import type { CoreEngineRuntime, ScanExcludeConfig } from '@i18nprune/core';

export type ExtractorProjectScanInput = {
  srcRoot: string;
  functions: string[];
  runtime: CoreEngineRuntime;
  exclude?: ScanExcludeConfig;
};
