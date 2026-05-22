import {
  hex16Id,
  prepareReportFromArchive,
  REPORT_SHARE_MAX_BYTES,
  sha256HexBytes,
  workerPayloadTooLargeError,
} from '@i18nprune/core';
import { edgePathRuntime } from '@i18nprune/core/runtime/edge';
import type { Hono } from 'hono';
import { uploadRateLimitResponse } from '../../../lib/rateLimit/upload';
import { ApiResponse } from '../../../response';
import { projectStore } from '../../shared/store';
import {
  hashDedupWarnings,
  loadReportRow,
  lookupReportIdByPayloadHash,
  replaceHostedReportForForce,
  reportDedupUploadPayload,
  reportUploadSuccessPayload,
} from '../../shared/hashDedup.js';
import { workerIngestForceFromRequest } from '../../shared/ingestForce.js';
import { putReport } from '../../shared/reportStore';
import {
  errorResponseFromIssues,
  workerArchiveProcessorContext,
  storageLimitResponseFromPersistError,
  workerErrorResponse,
} from '../../shared/workerIngest';
import type { WorkerEnv } from '../../types';

export function uploadReportArchiveRoute(app: Hono<WorkerEnv>): void {
  app.post('/reports/archive', async (c) => {
    const rateLimited = await uploadRateLimitResponse(c);
    if (rateLimited) return rateLimited;

    const force = workerIngestForceFromRequest(c);
    const requestReceivedAt = new Date().toISOString();
    const form = await c.req.formData();
    const archive = form.get('archive');
    if (!(archive instanceof File)) {
      return workerErrorResponse(c, 'UPLOAD_ARCHIVE_REQUIRED', 'Missing archive file (form field: archive)');
    }
    if (!archive.name.toLowerCase().endsWith('.zip')) {
      return workerErrorResponse(c, 'UPLOAD_UNSUPPORTED_ARCHIVE_FORMAT', 'Only .zip uploads are supported right now');
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
      requestReceivedAt,
      configJson: configJsonStr,
    });
    if (!prepared.ok) {
      return errorResponseFromIssues(c, prepared.issues);
    }
    if (prepared.manifest.byteSize > REPORT_SHARE_MAX_BYTES) {
      return ApiResponse.structuredError(
        c,
        workerPayloadTooLargeError({
          kind: 'report',
          receivedBytes: prepared.manifest.byteSize,
          maxBytes: REPORT_SHARE_MAX_BYTES,
        }),
      );
    }

    const stub = projectStore(c.env);

    if (!force) {
      const existingReportId = await lookupReportIdByPayloadHash(stub, prepared.manifest.payloadContentHash);
      if (existingReportId) {
        const row = await loadReportRow(stub, existingReportId);
        if (row) {
          return ApiResponse.success(
            c,
            reportDedupUploadPayload(row),
            200,
            hashDedupWarnings('report', existingReportId),
            undefined,
            'HASH_ALREADY_EXISTS',
          );
        }
      }
    } else {
      await replaceHostedReportForForce(stub, prepared.manifest.payloadContentHash);
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
      ingestRoute: 'archive' as const,
      prepareHost: 'worker-archive' as const,
      requestReceivedAt,
      prepareMeta: prepared.prepareMeta,
      processorContext: workerArchiveProcessorContext(),
    };

    try {
      await putReport(stub, row);
    } catch (err) {
      const storage = storageLimitResponseFromPersistError(c, err);
      if (storage) return storage;
      throw err;
    }

    return ApiResponse.success(c, reportUploadSuccessPayload({ ...row, lastAccessedAt: storedAt }));
  });
}
