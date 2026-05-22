import {
  hex16Id,
  HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION,
  prepareProjectSnapshotFromArchive,
  sha256HexBytes,
  validateHostedProjectIngestBody,
} from '@i18nprune/core';
import { edgePathRuntime } from '@i18nprune/core/runtime/edge';
import type { Hono } from 'hono';
import { ApiResponse } from '../../../response';
import { projectStore } from '../../shared/store';
import {
  badRequestFromIssues,
  persistProjectSnapshot,
  workerArchiveProcessorContext,
} from '../../shared/workerIngest';
import type { WorkerEnv } from '../../types';

export function uploadProjectArchiveRoute(app: Hono<WorkerEnv>): void {
  app.post('/projects/archive', async (c) => {
    const requestReceivedAt = new Date().toISOString();
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
      return badRequestFromIssues(c, prepared.issues);
    }

    const validated = validateHostedProjectIngestBody({
      schemaVersion: HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION,
      snapshot: prepared.parsed.snapshot,
      prepareMeta: prepared.prepareMeta,
    });
    if (!validated.ok) {
      return badRequestFromIssues(c, validated.issues);
    }

    const stub = projectStore(c.env);
    const persisted = await persistProjectSnapshot(stub, {
      snapshot: validated.envelope.snapshot,
      ingestRoute: 'archive',
      prepareMeta: prepared.prepareMeta,
      processorContext: workerArchiveProcessorContext(),
    });
    return ApiResponse.success(c, persisted);
  });
}
