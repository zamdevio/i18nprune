import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { initializeCliCacheState, resolveCliCacheState } from '../index.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('shared/cache/paths', () => {
  it('resolves canonical cache paths from project root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cache-'));
    tempDirs.push(root);
    const state = resolveCliCacheState({ projectRoot: root, cacheRootDir: path.join(root, '.cache') });
    expect(state.projectRoot).toBe(path.resolve(root));
    expect(state.metaPath.endsWith(path.join('.cache', 'meta.json'))).toBe(true);
    expect(state.filesPath.endsWith(path.join('projects', state.projectId, 'files.json'))).toBe(true);
    expect(state.analysisPath.endsWith(path.join('projects', state.projectId, 'analysis.json'))).toBe(true);
    expect(state.readOnly).toBe(false);
  });

  it('initializes enabled state for valid project root', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-cache-'));
    tempDirs.push(root);
    const cacheRootDir = path.join(root, '.cache');
    const { state, warnings } = initializeCliCacheState({ projectRoot: root, cacheRootDir });
    expect(state.enabled).toBe(true);
    expect(warnings).toEqual([]);
    expect(fs.existsSync(state.projectDir)).toBe(true);
  });

  it('disables cache for missing project root', () => {
    const root = path.join(os.tmpdir(), `i18nprune-missing-${Date.now().toString(36)}`);
    const { state, warnings } = initializeCliCacheState({ projectRoot: root, cacheRootDir: path.join(os.tmpdir(), '.x') });
    expect(state.enabled).toBe(false);
    expect(state.reason).toBe('project_root_missing');
    expect(warnings.length).toBe(1);
  });
});
