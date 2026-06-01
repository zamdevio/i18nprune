import type { DynamicKeySite } from '../extractor/dynamic/index.js';
import type { Issue } from '../json/envelope/index.js';
import type { RunEmitter } from '../shared/run/index.js';

export type DynamicRunOptions = {
  top?: number;
  full?: boolean;
};

export type DynamicHostHooks = {
  emit?: RunEmitter;
  runId?: string;
};

export type DynamicJsonPayload = {
  kind: 'locales-dynamic';
  sourceLocalePath: string;
  sourceLocaleCode: string;
  top: number | null;
  full: boolean;
  shown: number;
  dynamic: {
    count: number;
    sites: DynamicKeySite[];
  };
};

export type DynamicRunResult = {
  payload: DynamicJsonPayload;
  issues: Issue[];
  allSites: DynamicKeySite[];
};
