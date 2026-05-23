import type { Issue, ShareRunResult, WorkspaceSession } from '@i18nprune/core';

export type WebShareProjectOutcome =
  | { ok: true; result: ShareRunResult; humanLines: string[] }
  | { ok: false; issues: Issue[]; humanLines: string[] };

export type BindLocalShareInput = {
  session: WorkspaceSession & { mode: 'local' };
  workerBaseUrl: string;
  projectId: string;
  configJson?: string;
};

export type OpenSharedProjectOutcome =
  | {
      ok: true;
      session: WorkspaceSession;
      metadata: unknown;
    }
  | { ok: false; issue: Issue };
