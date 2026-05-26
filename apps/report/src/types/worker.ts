import type { Issue } from '@i18nprune/core';
import type { PayloadLoadResult } from '../data/loader/validate.js';

export type WorkerReportMetadataResult =
  | { ok: true; data: unknown }
  | { ok: false; issue: Issue };

export type WorkerReportDocumentResult = PayloadLoadResult;

export type ReportShareUploadOutcome =
  | { ok: true; reportId: string; link: string; deduped: boolean; humanLines: string[] }
  | { ok: false; issue: Issue; humanLines: string[] };

export type ReportShareLinkOnlyOutcome =
  | { ok: true; link: string; humanLines: string[] }
  | { ok: false; issue: Issue; humanLines: string[] };
