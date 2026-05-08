import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  defaultProjectsIndex,
  initializeCliCacheState,
  loadProjectsIndex,
  maybeHealCacheIndex,
  normalizeProjectRootKey,
  saveProjectsIndex,
  touchProjectIndex,
} from '../index.js';

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
    const loaded = loadProjectsIndex(state);
    expect(loaded.index.projects).toEqual({});
    const touched = touchProjectIndex(state, defaultProjectsIndex());
    const warn = saveProjectsIndex(state, touched);
    expect(warn).toBeUndefined();
    const reloaded = loadProjectsIndex(state);
    expect(reloaded.index.projects[normalizeProjectRootKey(state.projectRoot)]).toBe(state.projectId);
  });

  it('heals stale index entries when project dir is missing', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cache-'));
    tempDirs.push(root);
    const cacheRootDir = path.join(root, '.cache');
    const { state } = initializeCliCacheState({ projectRoot: root, cacheRootDir });
    let idx = touchProjectIndex(state, defaultProjectsIndex());
    idx.maintenance.healEveryRuns = 1;
    fs.rmSync(state.projectDir, { recursive: true, force: true });
    const healed = maybeHealCacheIndex(state, idx);
    expect(healed.index.projects[normalizeProjectRootKey(state.projectRoot)]).toBeUndefined();
  });
});
