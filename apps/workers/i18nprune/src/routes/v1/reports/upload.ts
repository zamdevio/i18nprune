import { hex16Id, REPORT_SHARE_MAX_BYTES, validateHostedReportIngestBody } from '@i18nprune/core';
import type { Hono } from 'hono';
import { ApiResponse } from '../../../response';
import { projectStore } from '../../shared/store';
import { putReport } from '../../shared/reportStore';
import { badRequestFromIssues } from '../../shared/workerIngest';
import type { WorkerEnv } from '../../types';

export function uploadReportRoute(app: Hono<WorkerEnv>): void {
  app.post('/reports', async (c) => {
    const contentType = c.req.header('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return ApiResponse.badRequest(
        c,
        'INGEST_JSON_REQUIRED',
        'POST /v1/reports expects application/json ({ document }). Use POST /v1/reports/archive for zip uploads.',
      );
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return ApiResponse.badRequest(c, 'INGEST_JSON_INVALID', 'Request body was not valid JSON.');
    }

    const built = await validateHostedReportIngestBody(body);
    if (!built.ok) {
      return badRequestFromIssues(c, built.issues);
    }
    if (built.manifest.byteSize > REPORT_SHARE_MAX_BYTES) {
      return ApiResponse.badRequest(
        c,
        'REPORT_PAYLOAD_TOO_LARGE',
        `Report exceeds max size (${REPORT_SHARE_MAX_BYTES} bytes)`,
      );
    }

    const reportId = hex16Id();
    const storedAt = new Date().toISOString();
    const row = {
      reportId,
      payloadContentHash: built.manifest.payloadContentHash,
      byteSize: built.manifest.byteSize,
      storedAt,
      lastAccessedAt: storedAt,
      document: built.document,
    };

    const stub = projectStore(c.env);
    await putReport(stub, row);

    return ApiResponse.success(c, {
      reportId,
      payloadContentHash: built.manifest.payloadContentHash,
      byteSize: built.manifest.byteSize,
      storedAt,
    });
  });
}
