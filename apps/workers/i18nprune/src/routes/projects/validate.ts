import { validate } from '@i18nprune/core';
import type { Hono } from 'hono';
import { ApiResponse } from '../../response';
import { getProjectById, projectStore } from '../shared/store';
import type { WorkerEnv } from '../types';
import type { ValidateBody } from './shared';

export function validateRoute(app: Hono<WorkerEnv>): void {
  app.post('/v1/projects/:id/validate', async (c) => {
    const stub = projectStore(c.env);
    const project = await getProjectById(stub, c.req.param('id'));
    if (!project) return ApiResponse.notFound(c, 'PROJECT_NOT_FOUND', 'Project not found');
    const body = (await c.req.json().catch(() => ({}))) as ValidateBody;
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
    const resolvedKeys = new Set(project.snapshot.extraction.resolvedKeys);
    const missing = validate.computeMissingLiteralKeysFromResolvedKeys(project.snapshot.sourceLocaleJson, resolvedKeys);

    return ApiResponse.success(c, {
      projectId: project.projectId,
      missing,
      count: project.snapshot.extraction.keyObservationsCount,
      dynamic: {
        count: project.snapshot.extraction.dynamicSitesCount,
        sites: project.snapshot.extraction.dynamicSitesPreview,
      },
      keyObservations: {
        count: project.snapshot.extraction.keyObservationsCount,
        observations: project.snapshot.extraction.keyObservationsPreview,
      },
    });
  });
}
