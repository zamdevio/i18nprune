import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG, parseI18nPruneConfig } from '../../config/index.js';
import * as keySitesOrchestrate from '../../extractor/keySites/orchestrate.js';
import { initializeCacheState } from '../../cache/setup/index.js';
import { createCoreContext } from '../../generate/context.js';
import { createNodeRuntimeAdapters } from '../../runtime/exports/node.js';
import crypto from 'node:crypto';
import type { CacheRuntime } from '../../types/cache/index.js';
import { resolveProjectAnalysis } from '../project.js';
import { patchProjectAnalysisFromSrcDelta } from '../rebuild.js';

function nodeCacheRuntime(adapters: ReturnType<typeof createNodeRuntimeAdapters>): CacheRuntime {
  return {
    fs: adapters.fs,
    path: adapters.path,
    system: adapters.system,
    hashText: (text) => crypto.createHash('sha256').update(text).digest('hex'),
    byteLength: (text) => Buffer.byteLength(text, 'utf8'),
  };
}

function writeFixture(root: string, mainSource: string): { srcRoot: string; localesDir: string; sourcePath: string } {
  const srcRoot = path.join(root, 'src');
  const localesDir = path.join(root, 'locales');
  fs.mkdirSync(srcRoot, { recursive: true });
  fs.mkdirSync(localesDir, { recursive: true });
  fs.writeFileSync(path.join(srcRoot, 'main.ts'), mainSource);
  fs.writeFileSync(path.join(srcRoot, 'other.ts'), 'export const OTHER = "other";');
  const sourcePath = path.join(localesDir, 'en.json');
  fs.writeFileSync(sourcePath, JSON.stringify({ app: { title: 'Title' } }));
  return { srcRoot, localesDir, sourcePath };
}

describe('analysis incremental rebuild', () => {
  it('patch(src delta) matches full scan for a single-file edit', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-analysis-rebuild-'));
    const cacheRoot = path.join(root, '.cache');
    fs.mkdirSync(cacheRoot);
    try {
      const { srcRoot, localesDir, sourcePath } = writeFixture(root, 'export const x = () => t("app.title");');
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

      const before = resolveProjectAnalysis(ctx);
      fs.writeFileSync(path.join(srcRoot, 'main.ts'), 'export const x = () => t("app.title"); t("app.new");');
      const fullAfter = resolveProjectAnalysis(ctx);

      const patched = patchProjectAnalysisFromSrcDelta(ctx, before, {
        added: [],
        changed: ['main.ts'],
        deleted: [],
      });

      expect(patched.keyObservations.length).toBe(fullAfter.keyObservations.length);
      expect(patched.dynamicSites).toEqual(fullAfter.dynamicSites);
      expect(patched.missingKeys).toEqual(fullAfter.missingKeys);
      expect(
        patched.keyObservations.map((o) => (o.kind === 'literal' || o.kind === 'template_resolved' ? o.resolvedKey : '')),
      ).toEqual(
        fullAfter.keyObservations.map((o) =>
          o.kind === 'literal' || o.kind === 'template_resolved' ? o.resolvedKey : '',
        ),
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('partial cache miss rescans only changed src files', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-analysis-rebuild-partial-'));
    const cacheRoot = path.join(root, '.cache');
    fs.mkdirSync(cacheRoot);
    try {
      const { srcRoot, localesDir, sourcePath } = writeFixture(root, 'export const x = () => t("app.title");');
      const adapters = createNodeRuntimeAdapters();
      for (let i = 0; i < 8; i += 1) {
        fs.writeFileSync(path.join(srcRoot, `file${i}.ts`), `export const f${i} = 1;`);
      }
      const config = parseI18nPruneConfig({
        ...DEFAULT_CONFIG,
        locales: { source: 'locales/en.json', directory: 'locales' },
        src: 'src',
        functions: ['t'],
        cache: { fullRescanThresholdPercent: 40 },
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

      resolveProjectAnalysis(ctx);
      const obsSpy = vi.spyOn(keySitesOrchestrate, 'scanProjectKeyObservations');

      fs.writeFileSync(path.join(srcRoot, 'main.ts'), 'export const x = () => t("app.title"); t("app.new");');
      const result = resolveProjectAnalysis(ctx);
      expect(result.cache?.analysisRebuild?.strategy).toBe('partial');

      const partialCalls = obsSpy.mock.calls.filter((call) => call[0].listFiles !== undefined);
      obsSpy.mockRestore();
      expect(partialCalls.length).toBeGreaterThan(0);
      expect(partialCalls[0]![0].listFiles!(srcRoot)).toHaveLength(1);
      expect(result.keyObservations.some((o) => o.kind === 'literal' && o.resolvedKey === 'app.new')).toBe(true);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
