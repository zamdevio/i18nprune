import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { PROJECT_REPORT_KIND, PROJECT_REPORT_SCHEMA_VERSION } from '@i18nprune/report';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../../config/index.js';
import { initializeCacheState } from '../../../cache/setup/index.js';
import { createCoreContext } from '../../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import type { CacheRuntime } from '../../../types/cache/index.js';
import type { RunEvent } from '../../../types/shared/run/index.js';
import { buildProjectPayload } from '../../payload/buildProjectPayload.js';
import { prepareReportPayload } from '../../../project/prepare/report.js';
import { runShare } from '../../ops/run.js';

function nodeCacheRuntime(adapters: ReturnType<typeof createNodeRuntimeAdapters>): CacheRuntime {
  return {
    fs: adapters.fs,
    path: adapters.path,
    system: adapters.system,
    hashText: (text) => crypto.createHash('sha256').update(text).digest('hex'),
    byteLength: (text) => Buffer.byteLength(text, 'utf8'),
  };
}

function writeMinimalProject(root: string): { sourcePath: string; localesDir: string; srcRoot: string } {
  const srcRoot = path.join(root, 'src');
  const localesDir = path.join(root, 'locales');
  fs.mkdirSync(srcRoot, { recursive: true });
  fs.mkdirSync(localesDir, { recursive: true });
  fs.writeFileSync(
    path.join(root, 'i18nprune.config.json'),
    JSON.stringify({
      locales: { source: 'locales/en.json', directory: 'locales' },
      src: 'src',
      functions: ['t'],
    }),
  );
  fs.writeFileSync(path.join(srcRoot, 'app.ts'), 'export const x = () => t("a");');
  const sourcePath = path.join(localesDir, 'en.json');
  fs.writeFileSync(sourcePath, JSON.stringify({ a: 'A' }));
  return { sourcePath, localesDir, srcRoot };
}

describe('buildProjectPayload', () => {
  it('builds a non-empty zip + manifest with payload/config hashes', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-share-payload-'));
    const cacheRoot = path.join(root, '.cache');
    fs.mkdirSync(cacheRoot);
    try {
      const { sourcePath, localesDir, srcRoot } = writeMinimalProject(root);
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

      const out = await buildProjectPayload({ ctx, projectRoot: root });
      expect(out.ok).toBe(true);
      if (!out.ok) return;
      expect(out.zipBytes.byteLength).toBeGreaterThan(0);
      expect(out.manifest.kind).toBe('project');
      expect(out.manifest.fileCount).toBeGreaterThanOrEqual(3);
      expect(out.manifest.payloadContentHash).toMatch(/^[a-f0-9]{64}$/);
      expect(out.manifest.configHash.length).toBeGreaterThan(0);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('prepareReportPayload', () => {
  it('validates report document and builds stable hash manifest', async () => {
    const out = await prepareReportPayload({
      reportDocument: {
        kind: PROJECT_REPORT_KIND,
        schemaVersion: PROJECT_REPORT_SCHEMA_VERSION,
        generatedAt: '2026-01-01T00:00:00.000Z',
        toolVersion: 'test/0.0.0',
        project: {
          cwd: '/tmp/p',
          sourceLocalePath: 'locales/en.json',
          localesDir: 'locales',
          srcRoot: 'src',
        },
        summary: {
          missingKeysCount: 0,
          dynamicSitesCount: 0,
          keyObservationsCount: 0,
          sourceFilesScannedCount: 1,
          ok: true,
        },
        details: {
          missingKeys: [],
          dynamicSites: [],
          keyObservations: [],
        },
      },
    });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.manifest.kind).toBe('report');
    expect(out.manifest.payloadContentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(out.manifest.byteSize).toBeGreaterThan(0);

    const out2 = await prepareReportPayload({
      reportDocument: {
        kind: PROJECT_REPORT_KIND,
        schemaVersion: PROJECT_REPORT_SCHEMA_VERSION,
        generatedAt: '2026-06-01T12:00:00.000Z',
        toolVersion: 'other/9.9.9',
        project: {
          cwd: '/other/cwd',
          sourceLocalePath: 'locales/en.json',
          localesDir: 'locales',
          srcRoot: 'src',
          environment: { platform: 'linux', arch: 'x64', nodeVersion: '22', osRelease: '6' },
        },
        summary: {
          missingKeysCount: 0,
          dynamicSitesCount: 0,
          keyObservationsCount: 0,
          sourceFilesScannedCount: 1,
          ok: true,
        },
        details: {
          missingKeys: [],
          dynamicSites: [],
          keyObservations: [],
        },
      },
    });
    expect(out2.ok).toBe(true);
    if (!out2.ok) return;
    expect(out2.manifest.payloadContentHash).toBe(out.manifest.payloadContentHash);
  });
});

describe('runShare (project / build)', () => {
  it('emits run.share.manifest on dry-run', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-share-run-'));
    const cacheRoot = path.join(root, '.cache');
    fs.mkdirSync(cacheRoot);
    try {
      const { sourcePath, localesDir, srcRoot } = writeMinimalProject(root);
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

      const events: RunEvent[] = [];
      const res = await runShare({
        ctx,
        projectRoot: root,
        workerBaseUrl: 'https://example.test',
        kind: 'project',
        source: 'build',
        hooks: {
          emit: (e) => events.push(e),
          dryRun: true,
        },
      });

      expect(res.skippedReason).toBe('dry_run');
      expect(events.some((e) => e.type === 'run.share.manifest')).toBe(true);
      const manifestEvt = events.find((e) => e.type === 'run.share.manifest');
      expect(manifestEvt && manifestEvt.type === 'run.share.manifest' ? manifestEvt.manifest.kind : '').toBe('project');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('uploads when hook returns worker success envelope', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-share-upload-'));
    const cacheRoot = path.join(root, '.cache');
    fs.mkdirSync(cacheRoot);
    try {
      const { sourcePath, localesDir, srcRoot } = writeMinimalProject(root);
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

      const res = await runShare({
        ctx,
        projectRoot: root,
        workerBaseUrl: 'https://example.test',
        kind: 'project',
        source: 'build',
        hooks: {
          interactive: false,
          uploadProject: async ({ envelope }) => {
            expect(envelope.schemaVersion).toBe(1);
            return {
              httpStatus: 200,
              body: {
                code: 'OK',
                success: true,
                data: { projectId: 'a1b2c3d4e5f6a7b8' },
                errors: [],
              },
            };
          },
        },
      });

      expect(res.action).toBe('uploaded');
      expect(res.workerIds.projectId).toBe('a1b2c3d4e5f6a7b8');
      expect(res.links.web).toContain('/p/a1b2c3d4e5f6a7b8');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('uploads report payload when report hook returns worker success envelope', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-share-report-upload-'));
    const cacheRoot = path.join(root, '.cache');
    fs.mkdirSync(cacheRoot);
    try {
      const { sourcePath, localesDir, srcRoot } = writeMinimalProject(root);
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

      const res = await runShare({
        ctx,
        projectRoot: root,
        workerBaseUrl: 'https://example.test',
        kind: 'report',
        source: 'document',
        reportDocument: {
          kind: PROJECT_REPORT_KIND,
          schemaVersion: PROJECT_REPORT_SCHEMA_VERSION,
          generatedAt: '2026-01-01T00:00:00.000Z',
          toolVersion: 'test/0.0.0',
          project: {
            cwd: '/tmp/p',
            sourceLocalePath: 'locales/en.json',
            localesDir: 'locales',
            srcRoot: 'src',
          },
          summary: {
            missingKeysCount: 0,
            dynamicSitesCount: 0,
            keyObservationsCount: 0,
            sourceFilesScannedCount: 1,
            ok: true,
          },
          details: { missingKeys: [], dynamicSites: [], keyObservations: [] },
        },
        hooks: {
          interactive: false,
          uploadReport: async () => ({
            httpStatus: 200,
            body: {
              code: 'OK',
              success: true,
              data: { reportId: 'r1b2c3d4e5f6a7b8' },
              errors: [],
            },
          }),
        },
      });

      expect(res.action).toBe('uploaded');
      expect(res.kind).toBe('report');
      expect(res.workerIds.reportId).toBe('r1b2c3d4e5f6a7b8');
      expect(res.links.report).toContain('/s/r1b2c3d4e5f6a7b8');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
