import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../config/index.js';
import { initializeCacheState } from '../../cache/setup/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import type { CacheRuntime } from '../../types/cache/index.js';
import { resolveShareJsonPath, saveShareJsonFile } from '../io/shareJson.js';
import { runShareDelete } from '../delete.js';
import { runShareList } from '../list.js';
import { runShareView } from '../view.js';

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
              links: { web: 'https://web.i18nprune.dev/p/p123' },
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
            body: { code: 'OK', success: true, data: { projectId: 'p123' }, errors: [] },
          }),
        },
      });
      expect(viewed.local?.workerProjectId).toBe('p123');
      expect(viewed.links.web).toContain('/p/p123');
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
              links: { report: 'https://report.i18nprune.dev/s/r123' },
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
