import {
  hex16Id,
  REPORT_SHARE_MAX_BYTES,
  validateHostedReportIngestBody,
  workerPayloadTooLargeError,
} from '@i18nprune/core';
import type { HostedIngestProcessorContext } from '@i18nprune/core';
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
import { errorResponseFromIssues, storageLimitResponseFromPersistError, workerErrorResponse } from '../../shared/workerIngest';
import type { WorkerEnv } from '../../types';

function processorContextFromDocument(document: Record<string, unknown>): HostedIngestProcessorContext | undefined {
  const toolVersion = typeof document.toolVersion === 'string' ? document.toolVersion : undefined;
  const project = document.project;
  if (!project || typeof project !== 'object' || Array.isArray(project)) {
    return toolVersion ? { toolVersion } : undefined;
  }
  const env = (project as Record<string, unknown>).environment;
  if (!env || typeof env !== 'object' || Array.isArray(env)) {
    return toolVersion ? { toolVersion } : undefined;
  }
  const e = env as Record<string, unknown>;
  const runtimeFamily = e.runtimeFamily;
  if (
    runtimeFamily !== 'windows' &&
    runtimeFamily !== 'darwin' &&
    runtimeFamily !== 'linux' &&
    runtimeFamily !== 'linux-wsl'
  ) {
    return toolVersion ? { toolVersion } : undefined;
  }
  return {
    toolVersion,
    environment: {
      platform: typeof e.platform === 'string' ? e.platform : '',
      arch: typeof e.arch === 'string' ? e.arch : '',
      nodeVersion: typeof e.nodeVersion === 'string' ? e.nodeVersion : '',
      osRelease: typeof e.osRelease === 'string' ? e.osRelease : '',
      runtimeFamily,
      ...(typeof e.distro === 'string' ? { distro: e.distro } : {}),
      ...(typeof e.wslDistroName === 'string' ? { wslDistroName: e.wslDistroName } : {}),
    },
  };
}

export function uploadReportRoute(app: Hono<WorkerEnv>): void {
  app.post('/reports', async (c) => {
    const rateLimited = await uploadRateLimitResponse(c);
    if (rateLimited) return rateLimited;

    const contentType = c.req.header('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return workerErrorResponse(
        c,
        'INGEST_JSON_REQUIRED',
        'POST /v1/reports expects application/json ({ document }). Use POST /v1/reports/archive for zip uploads.',
      );
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return workerErrorResponse(c, 'INGEST_JSON_INVALID', 'Request body was not valid JSON.');
    }

    const built = await validateHostedReportIngestBody(body);
    if (!built.ok) {
      return errorResponseFromIssues(c, built.issues);
    }
    if (built.manifest.byteSize > REPORT_SHARE_MAX_BYTES) {
      return ApiResponse.structuredError(
        c,
        workerPayloadTooLargeError({
          kind: 'report',
          receivedBytes: built.manifest.byteSize,
          maxBytes: REPORT_SHARE_MAX_BYTES,
        }),
      );
    }

    const force = workerIngestForceFromRequest(c, built.force);
    const stub = projectStore(c.env);

    if (!force) {
      const existingId = await lookupReportIdByPayloadHash(stub, built.manifest.payloadContentHash);
      if (existingId) {
        const row = await loadReportRow(stub, existingId);
        if (row) {
          return ApiResponse.success(
            c,
            reportDedupUploadPayload(row),
            200,
            hashDedupWarnings('report', existingId),
            undefined,
            'HASH_ALREADY_EXISTS',
          );
        }
      }
    } else {
      await replaceHostedReportForForce(stub, built.manifest.payloadContentHash);
    }

    const reportId = hex16Id();
    const storedAt = new Date().toISOString();
    const processorContext = processorContextFromDocument(built.document);
    const row = {
      reportId,
      payloadContentHash: built.manifest.payloadContentHash,
      byteSize: built.manifest.byteSize,
      storedAt,
      lastAccessedAt: storedAt,
      document: built.document,
      ingestRoute: 'prepared' as const,
      prepareHost: 'cli-share' as const,
      processorContext,
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
