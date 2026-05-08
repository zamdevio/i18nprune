import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { defaultProjectsIndex, initializeCliCacheState, prepareCacheForRun, saveProjectsIndex } from '../index.js';

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
    const out = prepareCacheForRun(state);
    expect(out.index.projects).not.toEqual({});
    expect(fs.existsSync(state.metaPath)).toBe(true);
    expect(fs.existsSync(state.projectDir)).toBe(true);
  });

  it('removes stale meta entry when project dir is missing on heal window', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cache-'));
    tempDirs.push(root);
    const cacheRootDir = path.join(root, '.cache');
    const { state } = initializeCliCacheState({ projectRoot: root, cacheRootDir });
    const idx = defaultProjectsIndex();
    idx.projects['/tmp/stale/'] = 'deadbeefdeadbeef';
    idx.maintenance.healEveryRuns = 1;
    idx.maintenance.runCount = 1;
    saveProjectsIndex(state, idx);
    const out = prepareCacheForRun(state);
    expect(out.index.projects['/tmp/stale/']).toBeUndefined();
  });
});
