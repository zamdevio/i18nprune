import {
  hex16Id,
  HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION,
  prepareProjectSnapshotFromArchive,
  sha256HexBytes,
  validateHostedProjectIngestBody,
} from '@i18nprune/core';
import { edgePathRuntime } from '@i18nprune/core/runtime/edge';
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
  workerArchiveProcessorContext,
  workerErrorResponse,
} from '../../shared/workerIngest';
import type { WorkerEnv } from '../../types';

export function uploadProjectArchiveRoute(app: Hono<WorkerEnv>): void {
  app.post('/projects/archive', async (c) => {
    const rateLimited = await uploadRateLimitResponse(c);
    if (rateLimited) return rateLimited;

    const requestReceivedAt = new Date().toISOString();
    const form = await c.req.formData();
    const archive = form.get('archive');
    if (!(archive instanceof File)) {
      return workerErrorResponse(c, 'UPLOAD_ARCHIVE_REQUIRED', 'Missing archive file (form field: archive)');
    }
    if (!archive.name.toLowerCase().endsWith('.zip')) {
      return workerErrorResponse(c, 'UPLOAD_UNSUPPORTED_ARCHIVE_FORMAT', 'Only .zip uploads are supported right now');
    }

    const force = workerIngestForceFromRequest(c);
    const bytes = new Uint8Array(await archive.arrayBuffer());
    const hash = await sha256HexBytes(bytes);
    const stub = projectStore(c.env);

    if (!force) {
      const existingId = await lookupProjectIdByContentHash(stub, hash);
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
    }

    const projectId = hex16Id();
    const configJson = form.get('configJson');
    const configJsonStr = typeof configJson === 'string' && configJson.trim() ? configJson : undefined;

    const prepared = await prepareProjectSnapshotFromArchive({
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

    const validated = validateHostedProjectIngestBody({
      schemaVersion: HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION,
      snapshot: prepared.parsed.snapshot,
      prepareMeta: prepared.prepareMeta,
    });
    if (!validated.ok) {
      return errorResponseFromIssues(c, validated.issues);
    }

    if (force) {
      await replaceHostedProjectForForce(stub, hash);
    }

    try {
      const persisted = await persistProjectSnapshot(stub, {
        snapshot: validated.envelope.snapshot,
        ingestRoute: 'archive',
        prepareMeta: prepared.prepareMeta,
        processorContext: workerArchiveProcessorContext(),
      });
      return ApiResponse.success(c, persisted);
    } catch (err) {
      const storage = storageLimitResponseFromPersistError(c, err);
      if (storage) return storage;
      throw err;
    }
  });
}
