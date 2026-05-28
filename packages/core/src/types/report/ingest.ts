import type { Issue } from '../json/envelope/index.js';
import type { ProjectPrepareMeta } from '../project/prepare/index.js';
import type { ShareReportManifest } from '../share/manifest.js';

export type ValidateReportIngestResult =
  | {
      ok: true;
      document: Record<string, unknown>;
      serialized: string;
      manifest: ShareReportManifest;
      /** Present when report was built from archive prepare (worker zip path). */
      prepareMeta?: ProjectPrepareMeta;
      /** When true, worker stores even if payload content hash already exists. */
      force?: boolean;
    }
  | { ok: false; issues: Issue[] };

/** Alias retained for share manifest / `runShare` call sites. */
export type PrepareReportPayloadResult = ValidateReportIngestResult;

export type ValidateHostedReportIngestResult = ValidateReportIngestResult;
