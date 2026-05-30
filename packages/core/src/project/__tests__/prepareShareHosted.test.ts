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
import { prepareShareHostedFromContext } from '../prepare/shareHosted.js';
import { validateHostedProjectIngestBody } from '../validate/hostedSnapshot.js';
import { HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION } from '../../shared/constants/project.js';

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
      locales: { source: 'en', directory: 'locales' },
      src: 'src',
      functions: ['t'],
    }),
  );
  fs.writeFileSync(path.join(srcRoot, 'app.ts'), 'export const x = () => t("a");');
  const sourcePath = path.join(localesDir, 'en.json');
  fs.writeFileSync(sourcePath, JSON.stringify({ a: 'A' }));
  return { sourcePath, localesDir, srcRoot };
}

describe('prepareShareHostedFromContext', () => {
  it('prepares project + report in one pass', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-share-hosted-'));
    const cacheRoot = path.join(root, '.cache');
    fs.mkdirSync(cacheRoot);
    try {
      const { sourcePath, localesDir, srcRoot } = writeMinimalProject(root);
      const adapters = createNodeRuntimeAdapters();
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        locales: { source: 'en', directory: 'locales' },
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

      const out = await prepareShareHostedFromContext({
        ctx,
        projectRoot: root,
        projectId: 'testpid00000001',
        projectHash: 'abc',
        wantProject: true,
        wantReport: true,
        prepareHost: 'cli-share',
        reportHost: {
          cwd: root,
          toolVersion: 'test/0.0.0',
          environment: {
            platform: 'linux',
            arch: 'x64',
            nodeVersion: 'v20.0.0',
            osRelease: '6.6',
            runtimeFamily: 'linux',
          },
        },
      });

      expect(out.ok).toBe(true);
      if (!out.ok) return;
      expect(out.project?.parsed.snapshot.extraction?.resolvedKeys.length).toBeGreaterThan(0);
      expect(out.report?.manifest.kind).toBe('report');

      const ingest = validateHostedProjectIngestBody({
        schemaVersion: HOSTED_PROJECT_SNAPSHOT_SCHEMA_VERSION,
        snapshot: out.project!.parsed.snapshot,
        prepareMeta: out.prepareMeta,
      });
      expect(ingest.ok).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
