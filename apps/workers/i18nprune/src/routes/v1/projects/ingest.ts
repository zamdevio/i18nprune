import { validateHostedProjectIngestBody } from '@i18nprune/core';
import type { Hono } from 'hono';
import { ApiResponse } from '../../../response';
import { projectStore } from '../../shared/store';
import { badRequestFromIssues, persistProjectSnapshot } from '../../shared/workerIngest';
import type { WorkerEnv } from '../../types';

export function ingestProjectRoute(app: Hono<WorkerEnv>): void {
  app.post('/projects', async (c) => {
    const contentType = c.req.header('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return ApiResponse.badRequest(
        c,
        'INGEST_JSON_REQUIRED',
        'POST /v1/projects expects application/json (prepared snapshot). Use POST /v1/projects/archive for zip uploads.',
      );
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return ApiResponse.badRequest(c, 'INGEST_JSON_INVALID', 'Request body was not valid JSON.');
    }

    const validated = validateHostedProjectIngestBody(body);
    if (!validated.ok) {
      return badRequestFromIssues(c, validated.issues);
    }

    const snapshot = validated.envelope.snapshot;
    if (!snapshot.requestReceivedAt) {
      snapshot.requestReceivedAt = new Date().toISOString();
    }

    const stub = projectStore(c.env);
    const persisted = await persistProjectSnapshot(stub, {
      snapshot,
      ingestRoute: 'prepared',
      prepareMeta: validated.envelope.prepareMeta,
      processorContext: validated.envelope.processorContext,
    });
    return ApiResponse.success(c, persisted);
  });
}
