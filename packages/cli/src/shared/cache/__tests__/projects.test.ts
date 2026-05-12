import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  defaultProjectsIndex,
  loadProjectsIndex,
  maybeHealCacheIndex,
  normalizeProjectRootKey,
  saveProjectsIndex,
  touchProjectIndex,
} from '@i18nprune/core';
import { initializeCliCacheState } from '../paths.js';
import { buildCliCacheRuntime } from '../runtime.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('shared/cache/projects', () => {
  it('loads/saves projects index and updates entry quickly', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cache-'));
    tempDirs.push(root);
    const cacheRootDir = path.join(root, '.cache');
    const { state } = initializeCliCacheState({ projectRoot: root, cacheRootDir });
    const runtime = buildCliCacheRuntime();
    const loaded = loadProjectsIndex(state, runtime);
    expect(loaded.index.projects).toEqual({});
    const touched = touchProjectIndex(state, defaultProjectsIndex(runtime), runtime);
    const warn = saveProjectsIndex(state, touched, runtime);
    expect(warn).toBeUndefined();
    const reloaded = loadProjectsIndex(state, runtime);
    expect(reloaded.index.projects[normalizeProjectRootKey(state.projectRoot)]).toBe(state.projectId);
  });

  it('heals stale index entries when project dir is missing', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cache-'));
    tempDirs.push(root);
    const cacheRootDir = path.join(root, '.cache');
    const { state } = initializeCliCacheState({ projectRoot: root, cacheRootDir });
    const runtime = buildCliCacheRuntime();
    const idx = touchProjectIndex(state, defaultProjectsIndex(runtime), runtime);
    idx.maintenance.healEveryRuns = 1;
    fs.rmSync(state.projectDir, { recursive: true, force: true });
    const healed = maybeHealCacheIndex(state, idx, runtime);
    expect(healed.index.projects[normalizeProjectRootKey(state.projectRoot)]).toBeUndefined();
  });
});
