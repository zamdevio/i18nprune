import { registerStoredReportRoutes } from '../reports';
import { validate, type ProjectWorkerReportBody } from '@i18nprune/core';
import { PROJECT_REPORT_KIND, PROJECT_REPORT_SCHEMA_VERSION, type ProjectReportDocument } from '@i18nprune/report';
import type { Hono } from 'hono';
import { ApiResponse } from '../../response';
import { getProjectById, projectStore } from '../shared/store';
import type { WorkerEnv } from '../types';

const WORKER_TOOL_VERSION = 'worker-i18nprune/0.1.0';

function basenameNoExt(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') return '-';
  const normalized = filePath.replace(/\\/g, '/');
  const segs = normalized.split('/');
  const name = segs[segs.length - 1] ?? normalized;
  return name.endsWith('.json') ? name.slice(0, -5) : name;
}

function stringFromConfig(config: Record<string, unknown> | null, key: string): string | null {
  if (!config) return null;
  const value = config[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function sourceLocalePathFromConfig(config: Record<string, unknown> | null): string | null {
  const loc = config?.locales;
  if (!loc || typeof loc !== 'object' || Array.isArray(loc)) return null;
  const s = (loc as Record<string, unknown>).source;
  return typeof s === 'string' && s.length > 0 ? s : null;
}

function localesDirFromConfig(config: Record<string, unknown> | null): string | null {
  const loc = config?.locales;
  if (!loc || typeof loc !== 'object' || Array.isArray(loc)) return null;
  const d = (loc as Record<string, unknown>).directory;
  return typeof d === 'string' && d.length > 0 ? d : null;
}

export function registerReportRoutes(app: Hono<WorkerEnv>): void {
  registerStoredReportRoutes(app);
  app.post('/v1/projects/:id/report', async (c) => {
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

    const extraction = project.snapshot.extraction;
    const sourceLocalePath =
      extraction.sourceLocalePath || sourceLocalePathFromConfig(project.snapshot.resolvedConfig) || '-';
    const srcRoot = extraction.srcRoot || stringFromConfig(project.snapshot.resolvedConfig, 'src') || '-';
    const localesDir =
      extraction.localesDir || localesDirFromConfig(project.snapshot.resolvedConfig) || '-';
    const resolvedKeys = new Set(extraction.resolvedKeys);
    const missing = validate.computeMissingLiteralKeysFromResolvedKeys(project.snapshot.sourceLocaleJson, resolvedKeys);
    const document: ProjectReportDocument = {
      kind: PROJECT_REPORT_KIND,
      schemaVersion: PROJECT_REPORT_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      toolVersion: WORKER_TOOL_VERSION,
      project: {
        cwd: '/project',
        sourceLocalePath,
        localesDir,
        srcRoot,
        sourceLocaleTag: basenameNoExt(sourceLocalePath),
        environment: {
          platform: 'cloudflare-worker',
          arch: '-',
          nodeVersion: '-',
          osRelease: '-',
          distro: '-',
        },
      },
      summary: {
        missingKeysCount: missing.length,
        dynamicSitesCount: extraction.dynamicSitesCount,
        keyObservationsCount: extraction.keyObservationsCount,
        ok: missing.length === 0,
      },
      details: {
        missingKeys: missing,
        dynamicSites: extraction.dynamicSitesPreview,
        keyObservations: extraction.keyObservationsPreview,
      },
    };

    return ApiResponse.success(c, {
      kind: 'report',
      format: 'json',
      outputPath: null,
      document,
    });
  });
}
