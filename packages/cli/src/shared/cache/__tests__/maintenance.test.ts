import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultProjectsIndex, prepareCacheForRun, saveProjectsIndex } from '@i18nprune/core';
import { initializeCliCacheState } from '../paths.js';
import { buildCliCacheRuntime } from '../runtime.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('shared/cache/maintenance', () => {
  it('writes meta mapping and ensures project directory exists', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cache-'));
    tempDirs.push(root);
    const cacheRootDir = path.join(root, '.cache');
    const { state } = initializeCliCacheState({ projectRoot: root, cacheRootDir });
    const out = prepareCacheForRun(state, buildCliCacheRuntime());
    expect(out.index.projects).not.toEqual({});
    expect(fs.existsSync(state.metaPath)).toBe(true);
    expect(fs.existsSync(state.projectDir)).toBe(true);
  });

  it('removes stale meta entry when project dir is missing on heal window', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cache-'));
    tempDirs.push(root);
    const cacheRootDir = path.join(root, '.cache');
    const { state } = initializeCliCacheState({ projectRoot: root, cacheRootDir });
    const runtime = buildCliCacheRuntime();
    const idx = defaultProjectsIndex(runtime);
    idx.projects['/tmp/stale/'] = 'deadbeefdeadbeef';
    idx.maintenance.healEveryRuns = 1;
    idx.maintenance.runCount = 1;
    saveProjectsIndex(state, idx, runtime);
    const out = prepareCacheForRun(state, runtime);
    expect(out.index.projects['/tmp/stale/']).toBeUndefined();
  });

  it('rebuilds malformed meta.json during preparation', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cache-'));
    tempDirs.push(root);
    const cacheRootDir = path.join(root, '.cache');
    const { state } = initializeCliCacheState({ projectRoot: root, cacheRootDir });
    fs.mkdirSync(path.dirname(state.metaPath), { recursive: true });
    fs.writeFileSync(state.metaPath, '{not json', 'utf8');

    const out = prepareCacheForRun(state, buildCliCacheRuntime());

    expect(out.warnings.some((w) => w.code === 'cache_malformed' && w.path === state.metaPath)).toBe(true);
    expect(out.index.projects).not.toEqual({});
    expect(() => JSON.parse(fs.readFileSync(state.metaPath, 'utf8'))).not.toThrow();
  });

  it('invalidates malformed project cache files so the run can rebuild them', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cache-'));
    tempDirs.push(root);
    const cacheRootDir = path.join(root, '.cache');
    const { state } = initializeCliCacheState({ projectRoot: root, cacheRootDir });
    fs.mkdirSync(state.projectDir, { recursive: true });
    fs.writeFileSync(state.filesPath, '{not json', 'utf8');
    fs.writeFileSync(state.analysisPath, '{not json', 'utf8');

    const out = prepareCacheForRun(state, buildCliCacheRuntime());

    expect(out.warnings.filter((w) => w.code === 'cache_malformed').map((w) => w.path).sort()).toEqual(
      [state.filesPath, state.analysisPath].sort(),
    );
    expect(fs.existsSync(state.filesPath)).toBe(false);
    expect(fs.existsSync(state.analysisPath)).toBe(false);
  });
});
