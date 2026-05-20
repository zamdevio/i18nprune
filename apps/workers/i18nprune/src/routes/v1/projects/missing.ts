import { resolveMissingPathsPlan, type ProjectWorkerMissingBody } from '@i18nprune/core';
import type { Hono } from 'hono';
import { ApiResponse } from '../../../response';
import { getProjectById, projectStore } from '../../shared/store';
import type { WorkerEnv } from '../../types';

export function missingRoute(app: Hono<WorkerEnv>): void {
  app.post('/projects/:id/missing', async (c) => {
    const stub = projectStore(c.env);
    const project = await getProjectById(stub, c.req.param('id'));
    if (!project) return ApiResponse.notFound(c, 'PROJECT_NOT_FOUND', 'Project not found');
    const body = (await c.req.json().catch(() => ({}))) as ProjectWorkerMissingBody;
    if (body.configJson !== undefined || body.config !== undefined || body.configOverrides !== undefined) {
      return ApiResponse.badRequest(
        c,
        'CONFIG_REUPLOAD_REQUIRED',
        'Config updates are upload-scoped. Re-upload via POST /v1/projects with archive (+ optional configJson) to rebuild snapshot cache.',
      );
    }
    if (!project.snapshot.extraction || !project.snapshot.sourceLocaleJson) {
      return ApiResponse.badRequest(
        c,
        'EXTRACTION_CACHE_MISSING',
        'Project cache is incomplete. Re-upload the project with a valid configJson.',
      );
    }
    const targetTag = typeof body.targetTag === 'string' && body.targetTag.length > 0
      ? body.targetTag
      : (project.snapshot.extraction.sourceLocalePath.split('/').pop() ?? 'en').replace(/\.json$/, '');
    const localeJson = (project.snapshot.localeJsonByTag ?? {})[targetTag];
    if (!localeJson) {
      return ApiResponse.notFound(c, 'LOCALE_NOT_FOUND', `Locale not found for target tag: ${targetTag}`);
    }
    const plan = resolveMissingPathsPlan({
      localeJson,
      resolvedKeys: new Set(project.snapshot.extraction.resolvedKeys),
      reportMissingPaths: Array.isArray(body.reportMissingPaths) ? body.reportMissingPaths : undefined,
    });
    return ApiResponse.success(c, {
      projectId: project.projectId,
      targetTag,
      toAdd: plan.toAdd,
      skippedNotInScan: plan.skippedNotInScan,
    });
  });
}
