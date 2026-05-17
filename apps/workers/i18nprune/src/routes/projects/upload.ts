import { buildLocaleJsonByTagFromArchive, extractor, mergePartialConfigIntoBase } from '@i18nprune/core';
import { edgePathRuntime } from '@i18nprune/core/runtime/edge';
import type { Hono } from 'hono';
import type { ProjectStoreRow } from '../../lib/do';
import { hex16Id, parseZipToSnapshot, sha256Hex } from '../../lib/project';
import { ApiResponse } from '../../response';
import { projectStore } from '../shared/store';
import type { WorkerEnv } from '../types';
import { configHash, normalizeConfig, parseUploadFailure, relativeProjectPath } from './shared';

export function uploadRoute(app: Hono<WorkerEnv>): void {
  app.post('/v1/projects', async (c) => {
    const form = await c.req.formData();
    const archive = form.get('archive');
    if (!(archive instanceof File)) {
      return ApiResponse.badRequest(c, 'UPLOAD_ARCHIVE_REQUIRED', 'Missing archive file (form field: archive)');
    }
    if (!archive.name.toLowerCase().endsWith('.zip')) {
      return ApiResponse.badRequest(c, 'UPLOAD_UNSUPPORTED_ARCHIVE_FORMAT', 'Only .zip uploads are supported right now');
    }

    const bytes = new Uint8Array(await archive.arrayBuffer());
    const hash = await sha256Hex(bytes);
    const stub = projectStore(c.env);
    const projectId = hex16Id();
    let parsedUpload: ReturnType<typeof parseZipToSnapshot>;
    try {
      parsedUpload = parseZipToSnapshot(projectId, hash, bytes);
    } catch (cause) {
      const parsed = parseUploadFailure(cause);
      return ApiResponse.badRequest(c, parsed.code, parsed.message);
    }
    const snapshot = parsedUpload.snapshot;

    const configJson = form.get('configJson');
    if (typeof configJson === 'string' && configJson.trim()) {
      try {
        const parsed = JSON.parse(configJson) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return ApiResponse.badRequest(
            c,
            'UPLOAD_CONFIG_JSON_INVALID',
            'Invalid configJson payload: expected valid JSON object',
          );
        }
        snapshot.resolvedConfig = mergePartialConfigIntoBase(snapshot.resolvedConfig, parsed as Record<string, unknown>);
      } catch {
        return ApiResponse.badRequest(
          c,
          'UPLOAD_CONFIG_JSON_INVALID',
          'Invalid configJson payload: expected valid JSON object',
        );
      }
    }

    const normalized = normalizeConfig(snapshot.resolvedConfig);
    if (!normalized) {
      return ApiResponse.badRequest(
        c,
        'UPLOAD_CONFIG_REQUIRED',
        'Config required. Pass configJson, include i18nprune.config.json, or use a parseable i18nprune.config.ts/js with locales.source, locales.directory, src, and functions[].',
      );
    }

    const srcRootAbs = edgePathRuntime.resolve('/project', normalized.src);
    const sourceAbs = edgePathRuntime.resolve('/project', normalized.source);
    const sourceRaw = parsedUpload.textFiles[relativeProjectPath(sourceAbs)];
    if (!sourceRaw) {
      return ApiResponse.badRequest(
        c,
        'SOURCE_LOCALE_NOT_FOUND',
        `Configured source locale file not found in uploaded zip: ${normalized.source}`,
      );
    }
    let sourceLocaleJson: unknown;
    try {
      sourceLocaleJson = JSON.parse(sourceRaw) as unknown;
    } catch {
      return ApiResponse.badRequest(
        c,
        'SOURCE_LOCALE_INVALID_JSON',
        `Configured source locale is invalid JSON: ${normalized.source}`,
      );
    }
    if (!sourceLocaleJson || typeof sourceLocaleJson !== 'object' || Array.isArray(sourceLocaleJson)) {
      return ApiResponse.badRequest(c, 'SOURCE_LOCALE_INVALID_SHAPE', 'Configured source locale must be a JSON object.');
    }

    const allPaths = Object.keys(parsedUpload.textFiles);
    const listFiles = (srcRootPath: string): string[] => {
      const root = srcRootPath.endsWith('/') ? srcRootPath : `${srcRootPath}/`;
      return allPaths
        .map((p) => edgePathRuntime.resolve('/project', p))
        .filter((abs) => abs === srcRootPath || abs.startsWith(root));
    };
    const readFile = (filePath: string): string => {
      const rel = relativeProjectPath(filePath);
      const raw = parsedUpload.textFiles[rel];
      if (typeof raw !== 'string') throw new Error(`missing file ${filePath}`);
      return raw;
    };

    const observations = extractor.scanProjectKeyObservations({
      srcRoot: srcRootAbs,
      cwd: '/project',
      path: edgePathRuntime,
      readFile,
      listFiles,
      functions: normalized.functions,
      exclude: normalized.exclude,
    });
    const resolvedKeys = extractor.resolvedKeysFromObservations(observations);
    const dynamicSites = extractor.dynamic.scanProjectDynamicKeySites({
      srcRoot: srcRootAbs,
      cwd: '/project',
      path: edgePathRuntime,
      readFile,
      listFiles,
      functions: normalized.functions,
      exclude: normalized.exclude,
    });

    snapshot.sourceLocaleJson = sourceLocaleJson as Record<string, unknown>;
    const localesRootAbs = edgePathRuntime.resolve('/project', normalized.localesDir);
    snapshot.localeJsonByTag = buildLocaleJsonByTagFromArchive({
      localesDirAbsolute: localesRootAbs,
      sourceLocaleAbsolute: sourceAbs,
      archiveRelPaths: Object.keys(parsedUpload.textFiles),
      resolveArchiveAbsolute: (rel) => edgePathRuntime.resolve('/project', rel),
      path: edgePathRuntime,
      locales: {
        source: normalized.source,
        directory: normalized.localesDir,
        mode: normalized.localesMode,
        structure: normalized.localesStructure,
      },
      readText: (rel) => parsedUpload.textFiles[rel],
    });
    snapshot.extraction = {
      configHash: await configHash(normalized),
      sourceLocalePath: normalized.source,
      srcRoot: normalized.src,
      localesDir: normalized.localesDir,
      resolvedKeys: [...resolvedKeys],
      keyObservationsCount: observations.length,
      dynamicSitesCount: dynamicSites.length,
      keyObservationsPreview: observations,
      dynamicSitesPreview: dynamicSites,
      computedAt: new Date().toISOString(),
    };

    const row: ProjectStoreRow = { projectId, projectHash: hash, snapshot };
    await stub.fetch('https://do/project', { method: 'PUT', body: JSON.stringify(row) });

    return ApiResponse.success(c, {
      projectId,
      snapshotMeta: {
        uploadedAt: snapshot.uploadedAt,
        fileCount: snapshot.fileCount,
        textFileCount: snapshot.textFileCount,
        detectedConfigPath: snapshot.detectedConfigPath,
        extractionReady: true,
        extractionComputedAt: snapshot.extraction.computedAt,
      },
    });
  });
}
