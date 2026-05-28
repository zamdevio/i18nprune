import {
  buildReportDocumentFromPreparedSnapshot,
  createCoreContext,
  runReport,
  type CoreContext,
  type ProjectWorkerReportBody,
  type ReportHostHooks,
} from '@i18nprune/core';
import type { Hono } from 'hono';
import { ApiResponse } from '../../../response';
import { getProjectById, projectStore } from '../../shared/store';
import type { WorkerEnv } from '../../types';

const WORKER_TOOL_VERSION = 'worker-i18nprune/0.1.0';

function createNoopCoreContext(): CoreContext {
  return createCoreContext({
    config: {} as CoreContext['config'],
    adapters: {} as CoreContext['adapters'],
    env: {} as CoreContext['env'],
    paths: {
      sourceLocale: '',
      localesDir: '',
      srcRoot: '',
    },
  });
}

function reportHost(): ReportHostHooks {
  return {
    emit: () => {},
    runId: 'worker-project-report',
    environment: {
      platform: 'cloudflare-worker',
      arch: '-',
      nodeVersion: '-',
      osRelease: '-',
      distro: '-',
      runtimeFamily: 'linux',
    },
    cwd: '/project',
    toolVersion: WORKER_TOOL_VERSION,
  };
}

export function reportRoute(app: Hono<WorkerEnv>): void {
  app.post('/projects/:id/report', async (c) => {
    const stub = projectStore(c.env);
    const project = await getProjectById(stub, c.req.param('id'));
    if (!project) return ApiResponse.notFound(c, 'PROJECT_NOT_FOUND', 'Project not found');
    const body = (await c.req.json().catch(() => ({}))) as ProjectWorkerReportBody;
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
    const host = reportHost();
    const preloadedDocument = buildReportDocumentFromPreparedSnapshot(project.snapshot, host);
    const run = runReport(createNoopCoreContext(), { source: 'file', preloadedDocument }, host);

    return ApiResponse.success(c, {
      ...run.payload,
      format: 'json',
      outputPath: null,
    });
  });
}
