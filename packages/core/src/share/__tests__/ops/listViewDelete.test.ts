import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../../config/index.js';
import { initializeCacheState } from '../../../cache/setup/index.js';
import { createCoreContext } from '../../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import type { CacheRuntime } from '../../../types/cache/index.js';
import { resolveShareJsonPath, saveShareJsonFile } from '../../cache/io/shareJson.js';
import { runShareDelete } from '../../ops/delete.js';
import { runShareList } from '../../ops/list.js';
import { runShareView } from '../../ops/view.js';

function nodeCacheRuntime(adapters: ReturnType<typeof createNodeRuntimeAdapters>): CacheRuntime {
  return {
    fs: adapters.fs,
    path: adapters.path,
    system: adapters.system,
    hashText: (text) => crypto.createHash('sha256').update(text).digest('hex'),
    byteLength: (text) => Buffer.byteLength(text, 'utf8'),
  };
}

function writeProject(root: string): { sourcePath: string; localesDir: string; srcRoot: string } {
  const srcRoot = path.join(root, 'src');
  const localesDir = path.join(root, 'locales');
  fs.mkdirSync(srcRoot, { recursive: true });
  fs.mkdirSync(localesDir, { recursive: true });
  fs.writeFileSync(path.join(root, 'i18nprune.config.json'), '{}');
  fs.writeFileSync(path.join(srcRoot, 'app.ts'), 'export const x = () => t("a");');
  const sourcePath = path.join(localesDir, 'en.json');
  fs.writeFileSync(sourcePath, JSON.stringify({ a: 'A' }));
  return { sourcePath, localesDir, srcRoot };
}

function makeCtx(root: string) {
  const cacheRoot = path.join(root, '.cache');
  fs.mkdirSync(cacheRoot, { recursive: true });
  const { sourcePath, localesDir, srcRoot } = writeProject(root);
  const adapters = createNodeRuntimeAdapters();
  const config = parseI18nPruneConfig({
    ...DEFAULT_CONFIG,
    locales: { source: 'locales/en.json', directory: 'locales' },
    src: 'src',
    functions: ['t'],
  });
  const cacheRuntime = nodeCacheRuntime(adapters);
  const { state } = initializeCacheState({
    projectRoot: root,
    cacheRootDir: cacheRoot,
    runtime: cacheRuntime,
  });
  const ctx = createCoreContext({
    config,
    adapters,
    env: {},
    paths: { sourceLocale: sourcePath, localesDir, srcRoot },
    cache: { state, runtime: cacheRuntime },
  });
  return { ctx, cacheRuntime };
}

describe('runShareList/view/delete', () => {
  it('lists local entries and overlays local data in view', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-share-lvd-'));
    try {
      const { ctx, cacheRuntime } = makeCtx(root);
      const sharePath = resolveShareJsonPath(ctx.cache!.state.projectDir, cacheRuntime.path);
      saveShareJsonFile({
        sharePath,
        runtime: cacheRuntime,
        file: {
          version: 1,
          entries: [
            {
              kind: 'project',
              workerBaseUrl: 'https://w.test',
              workerProjectId: 'p123',
              payloadContentHash: 'h',
              configHash: 'c',
              byteSize: 1,
              uploadedAt: '2026-01-01T00:00:00.000Z',
              lastUsedAt: '2026-01-01T00:00:00.000Z',
              links: { web: 'https://web.i18nprune.dev/#/workspace?id=p123' },
            },
          ],
        },
      });

      const listed = runShareList({ ctx });
      expect(listed.entries).toHaveLength(1);

      const viewed = await runShareView({
        ctx,
        kind: 'project',
        workerBaseUrl: 'https://w.test',
        workerId: 'p123',
        hooks: {
          fetchRemoteProjectRow: async () => ({
            httpStatus: 200,
            body: {
              code: 'OK',
              success: true,
              data: {
                version: 1,
                schemaVersion: 1,
                formatVersion: 1,
                artifact: {
                  kind: 'project',
                  id: 'p123',
                  contentHash: 'h',
                  byteSize: 100,
                  fileCount: 2,
                  textFileCount: 2,
                  detectedConfigPath: 'i18nprune.config.json',
                  localeTags: ['en'],
                },
                timing: {
                  preparedAt: '2026-01-01T00:00:00.000Z',
                  requestReceivedAt: '2026-01-01T00:00:00.000Z',
                  storedAt: '2026-01-01T00:00:01.000Z',
                  lastAccessedAt: '2026-01-01T00:00:01.000Z',
                  prepare: { zipParsedMs: 1, analysisMs: 2, extractionMs: 3, totalMs: 10 },
                  extraction: {
                    startedAt: '2026-01-01T00:00:00.100Z',
                    computedAt: '2026-01-01T00:00:00.500Z',
                    durationMs: 400,
                  },
                  edge: { persistMs: 500 },
                },
                processor: {
                  surface: 'cli',
                  surfaceLabel: 'i18nprune CLI',
                  route: 'prepared',
                  routeLabel: 'Prepared JSON ingest',
                  prepareHost: 'cli-share',
                  toolVersion: '0.1.0',
                  sdk: 'i18nprune-cli',
                  sdkVersion: '0.1.0',
                  prepareSummary: 'Prepared on disk',
                  environment: null,
                },
                analysis: {
                  configHash: 'cfg',
                  sourceLocalePath: 'locales/en.json',
                  srcRoot: 'src',
                  localesDir: 'locales',
                  keyObservationsCount: 1,
                  dynamicSitesCount: 0,
                },
                summary: {
                  localeCount: 1,
                  missingKeysCount: 0,
                  ok: true,
                },
                execution: {
                  surface: 'cli',
                  host: 'cli-share',
                  route: 'prepared',
                  transport: 'https-json',
                  computeLocation: 'edge',
                },
                cache: {
                  available: true,
                  analysis: 'hit',
                  analysisReason: 'cache_hit',
                  timingsTrustworthy: false,
                  filesEpoch: 'abc123',
                  projectCacheEnabled: true,
                },
                storage: { backend: 'durable-object', dedupByContentHash: true, contentAddressed: true },
                retention: {
                  policy: 'idle-7d',
                  expiresAt: '2026-01-08T00:00:00.000Z',
                  lastAccessedAt: '2026-01-01T00:00:01.000Z',
                },
                capabilities: {
                  preparedUploads: true,
                  archiveUploads: true,
                  readOperations: ['metadata', 'snapshot', 'tree', 'validate', 'review', 'missing', 'locales', 'doctor', 'report'],
                  project: true,
                  report: false,
                },
              },
              errors: [],
            },
          }),
        },
      });
      expect(viewed.local?.workerProjectId).toBe('p123');
      expect(viewed.links.web).toContain('/#/workspace?id=p123');
      expect(
        viewed.remoteMetadata &&
          'artifact' in viewed.remoteMetadata &&
          viewed.remoteMetadata.artifact &&
          typeof viewed.remoteMetadata.artifact === 'object' &&
          'id' in viewed.remoteMetadata.artifact &&
          viewed.remoteMetadata.artifact.id,
      ).toBe('p123');
      if (viewed.remoteMetadata && 'processor' in viewed.remoteMetadata) {
        expect(viewed.remoteMetadata.processor.sdkVersion).toBe('0.1.0');
      }

      const missing = await runShareView({
        ctx,
        kind: 'project',
        workerBaseUrl: 'https://w.test',
        workerId: 'gone',
        hooks: {
          fetchRemoteProjectRow: async () => ({
            httpStatus: 404,
            body: {
              code: 'PROJECT_NOT_FOUND',
              success: false,
              data: null,
              errors: [{ code: 'PROJECT_NOT_FOUND', message: 'not found' }],
            },
          }),
        },
      });
      expect(missing.issues.some((i) => i.code === 'i18nprune.share.remote_project_not_found')).toBe(true);
      expect(missing.remote).toBeUndefined();

      const purged = await runShareView({
        ctx,
        kind: 'project',
        workerBaseUrl: 'https://w.test',
        workerId: 'p123',
        hooks: {
          fetchRemoteProjectRow: async () => ({
            httpStatus: 404,
            body: {
              code: 'PROJECT_NOT_FOUND',
              success: false,
              data: null,
              errors: [{ code: 'PROJECT_NOT_FOUND', message: 'not found' }],
            },
          }),
        },
      });
      expect(purged.purgedLocalCache).toBe(true);
      expect(purged.local).toBeUndefined();
      const afterList = runShareList({ ctx });
      expect(afterList.entries.some((e) => e.workerProjectId === 'p123')).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('deletes local and remote report entry when requested', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-share-lvd-del-'));
    try {
      const { ctx, cacheRuntime } = makeCtx(root);
      const sharePath = resolveShareJsonPath(ctx.cache!.state.projectDir, cacheRuntime.path);
      saveShareJsonFile({
        sharePath,
        runtime: cacheRuntime,
        file: {
          version: 1,
          entries: [
            {
              kind: 'report',
              workerBaseUrl: 'https://w.test',
              workerReportId: 'r123',
              payloadContentHash: 'h',
              byteSize: 1,
              uploadedAt: '2026-01-01T00:00:00.000Z',
              lastUsedAt: '2026-01-01T00:00:00.000Z',
              links: { report: 'https://report.i18nprune.dev/#/?id=r123' },
            },
          ],
        },
      });

      const res = await runShareDelete({
        ctx,
        kind: 'report',
        workerBaseUrl: 'https://w.test',
        workerId: 'r123',
        remote: true,
        hooks: {
          deleteRemoteReport: async () => ({
            httpStatus: 200,
            body: { code: 'OK', success: true, data: { deleted: true }, errors: [] },
          }),
        },
      });

      expect(res.deletedLocal).toBe(true);
      expect(res.deletedRemote).toBe(true);
      expect(runShareList({ ctx }).entries).toHaveLength(0);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
