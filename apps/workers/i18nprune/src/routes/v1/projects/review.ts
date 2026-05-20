import { basenameNoExt, buildReviewJsonData, type ProjectWorkerConfigBody } from '@i18nprune/core';
import type { Hono } from 'hono';
import { ApiResponse } from '../../../response';
import { getProjectById, projectStore } from '../../shared/store';
import type { WorkerEnv } from '../../types';

export function reviewRoute(app: Hono<WorkerEnv>): void {
  app.post('/projects/:id/review', async (c) => {
    const stub = projectStore(c.env);
    const project = await getProjectById(stub, c.req.param('id'));
    if (!project) return ApiResponse.notFound(c, 'PROJECT_NOT_FOUND', 'Project not found');
    const body = (await c.req.json().catch(() => ({}))) as ProjectWorkerConfigBody;
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
    const sourceLocalePath = project.snapshot.extraction.sourceLocalePath;
    const sourceTag = basenameNoExt(sourceLocalePath);
    const targetLocaleJsonByFile: Record<string, unknown> = {};
    for (const [tag, json] of Object.entries(project.snapshot.localeJsonByTag ?? {})) {
      if (tag === sourceTag) continue;
      targetLocaleJsonByFile[`${tag}.json`] = json;
    }
    const data = buildReviewJsonData({
      sourceLocalePath,
      localesDir: project.snapshot.extraction.localesDir,
      dynamicKeySites: project.snapshot.extraction.dynamicSitesCount,
      sourceLocaleJson: project.snapshot.sourceLocaleJson,
      targetLocaleJsonByFile,
    });
    return ApiResponse.success(c, { projectId: project.projectId, ...data });
  });
}
