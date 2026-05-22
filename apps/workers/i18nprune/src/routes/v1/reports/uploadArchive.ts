import { hex16Id, prepareReportFromArchive, REPORT_SHARE_MAX_BYTES, sha256HexBytes } from '@i18nprune/core';
import { edgePathRuntime } from '@i18nprune/core/runtime/edge';
import type { Hono } from 'hono';
import { ApiResponse } from '../../../response';
import { projectStore } from '../../shared/store';
import { putReport } from '../../shared/reportStore';
import { badRequestFromIssues } from '../../shared/workerIngest';
import type { WorkerEnv } from '../../types';

export function uploadReportArchiveRoute(app: Hono<WorkerEnv>): void {
  app.post('/reports/archive', async (c) => {
    const form = await c.req.formData();
    const archive = form.get('archive');
    if (!(archive instanceof File)) {
      return ApiResponse.badRequest(c, 'UPLOAD_ARCHIVE_REQUIRED', 'Missing archive file (form field: archive)');
    }
    if (!archive.name.toLowerCase().endsWith('.zip')) {
      return ApiResponse.badRequest(c, 'UPLOAD_UNSUPPORTED_ARCHIVE_FORMAT', 'Only .zip uploads are supported right now');
    }

    const bytes = new Uint8Array(await archive.arrayBuffer());
    const hash = await sha256HexBytes(bytes);
    const projectId = hex16Id();
    const configJson = form.get('configJson');
    const configJsonStr = typeof configJson === 'string' && configJson.trim() ? configJson : undefined;

    const prepared = await prepareReportFromArchive({
      projectId,
      projectHash: hash,
      zipBytes: bytes,
      path: edgePathRuntime,
      prepareHost: 'worker-archive',
      requestReceivedAt: new Date().toISOString(),
      configJson: configJsonStr,
    });
    if (!prepared.ok) {
      return badRequestFromIssues(c, prepared.issues);
    }
    if (prepared.manifest.byteSize > REPORT_SHARE_MAX_BYTES) {
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
      payloadContentHash: prepared.manifest.payloadContentHash,
      byteSize: prepared.manifest.byteSize,
      storedAt,
      lastAccessedAt: storedAt,
      document: prepared.document,
    };

    const stub = projectStore(c.env);
    await putReport(stub, row);

    return ApiResponse.success(c, {
      reportId,
      payloadContentHash: prepared.manifest.payloadContentHash,
      byteSize: prepared.manifest.byteSize,
      storedAt,
    });
  });
}
