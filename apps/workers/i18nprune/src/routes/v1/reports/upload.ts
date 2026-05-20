import { buildReportPayload, hex16Id, REPORT_SHARE_MAX_BYTES } from '@i18nprune/core';
import type { Hono } from 'hono';
import { ApiResponse } from '../../../response';
import { projectStore } from '../../shared/store';
import { putReport } from '../../shared/reportStore';
import type { WorkerEnv } from '../../types';

type UploadBody = {
  document?: unknown;
};

export function uploadReportRoute(app: Hono<WorkerEnv>): void {
  app.post('/reports', async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as UploadBody;
    if (body.document === undefined) {
      return ApiResponse.badRequest(c, 'REPORT_DOCUMENT_REQUIRED', 'Missing document (JSON body field: document)');
    }

    const built = await buildReportPayload({ reportDocument: body.document });
    if (!built.ok) {
      return ApiResponse.badRequest(
        c,
        'REPORT_SCHEMA_INVALID',
        built.issues[0]?.message ?? 'Report document does not match project report schema.',
      );
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
