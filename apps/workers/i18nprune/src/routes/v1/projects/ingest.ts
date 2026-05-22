import {
  HOSTED_PROJECT_PREPARED_MAX_BYTES,
  validateHostedProjectIngestBody,
  workerPayloadTooLargeError,
} from '@i18nprune/core';
import type { Hono } from 'hono';
import { uploadRateLimitResponse } from '../../../lib/rateLimit/upload';
import { ApiResponse } from '../../../response';
import { projectStore } from '../../shared/store';
import {
  hashDedupWarnings,
  loadProjectRow,
  lookupProjectIdByContentHash,
  projectDedupUploadPayload,
  replaceHostedProjectForForce,
} from '../../shared/hashDedup.js';
import { workerIngestForceFromRequest } from '../../shared/ingestForce.js';
import {
  errorResponseFromIssues,
  persistProjectSnapshot,
  storageLimitResponseFromPersistError,
  workerErrorResponse,
} from '../../shared/workerIngest';
import type { WorkerEnv } from '../../types';

export function ingestProjectRoute(app: Hono<WorkerEnv>): void {
  app.post('/projects', async (c) => {
    const rateLimited = await uploadRateLimitResponse(c);
    if (rateLimited) return rateLimited;

    const contentType = c.req.header('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return workerErrorResponse(
        c,
        'INGEST_JSON_REQUIRED',
        'POST /v1/projects expects application/json (prepared snapshot). Use POST /v1/projects/archive for zip uploads.',
      );
    }

    const raw = await c.req.arrayBuffer();
    if (raw.byteLength > HOSTED_PROJECT_PREPARED_MAX_BYTES) {
      return ApiResponse.structuredError(
        c,
        workerPayloadTooLargeError({
          kind: 'project_prepared',
          receivedBytes: raw.byteLength,
          maxBytes: HOSTED_PROJECT_PREPARED_MAX_BYTES,
        }),
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder().decode(raw)) as unknown;
    } catch {
      return workerErrorResponse(c, 'INGEST_JSON_INVALID', 'Request body was not valid JSON.');
    }

    const validated = validateHostedProjectIngestBody(body);
    if (!validated.ok) {
      return errorResponseFromIssues(c, validated.issues);
    }

    const snapshot = validated.envelope.snapshot;
    if (!snapshot.requestReceivedAt) {
      snapshot.requestReceivedAt = new Date().toISOString();
    }

    const force = workerIngestForceFromRequest(c, validated.envelope.force);
    const stub = projectStore(c.env);

    if (!force) {
      const existingId = await lookupProjectIdByContentHash(stub, snapshot.projectHash);
      if (existingId) {
        const row = await loadProjectRow(stub, existingId);
        if (row) {
          return ApiResponse.success(
            c,
            projectDedupUploadPayload(row),
            200,
            hashDedupWarnings('project', existingId),
            undefined,
            'HASH_ALREADY_EXISTS',
          );
        }
      }
    } else {
      await replaceHostedProjectForForce(stub, snapshot.projectHash);
    }

    try {
      const persisted = await persistProjectSnapshot(stub, {
        snapshot,
        ingestRoute: 'prepared',
        prepareMeta: validated.envelope.prepareMeta,
        processorContext: validated.envelope.processorContext,
      });
      return ApiResponse.success(c, persisted);
    } catch (err) {
      const storage = storageLimitResponseFromPersistError(c, err);
      if (storage) return storage;
      throw err;
    }
  });
}
