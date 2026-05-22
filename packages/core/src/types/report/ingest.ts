import type { Issue } from '../json/envelope/index.js';
import type { ShareReportManifest } from '../share/manifest.js';

export type ValidateReportIngestResult =
  | { ok: true; document: Record<string, unknown>; serialized: string; manifest: ShareReportManifest }
  | { ok: false; issues: Issue[] };

/** Alias retained for share manifest / `runShare` call sites. */
export type PrepareReportPayloadResult = ValidateReportIngestResult;

export type ValidateHostedReportIngestResult = ValidateReportIngestResult;
