import type { Issue } from '@i18nprune/core';

export type WorkerProjectMetadataResult =
  | { ok: true; data: unknown }
  | { ok: false; issue: Issue };
