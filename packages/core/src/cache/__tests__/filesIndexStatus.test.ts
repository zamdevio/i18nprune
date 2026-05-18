import { describe, expect, it } from 'vitest';
import { resolveFilesIndexStatus } from '../filesIndexStatus.js';
import { defaultProjectFilesState } from '../io/index.js';
import type { CacheRuntime } from '../../types/cache/index.js';
import type { RuntimeFsPort } from '../../types/runtime/index.js';

function runtime(exists: boolean): CacheRuntime {
  const fs: RuntimeFsPort = {
    exists: () => exists,
    readText: () => {
      throw new Error('unused');
    },
    statKind: () => (exists ? 'file' : 'missing'),
    listDir: () => [],
    writeText: () => {},
    deleteFile: () => {},
    mkdirp: () => {},
  };
  return {
    fs,
    path: {
      join: (...p) => p.join('/'),
      dirname: () => '/',
      basename: (v) => v,
      normalize: (v) => v,
      relative: () => '',
      resolve: (...p) => p.join('/'),
      isAbsolute: () => false,
    },
    system: { cwd: () => '/', now: () => 0 },
  };
}

describe('resolveFilesIndexStatus', () => {
  it('reports missing when files.json is absent', () => {
    const status = resolveFilesIndexStatus({
      prev: defaultProjectFilesState(),
      warnings: [],
      filesPath: '/cache/files.json',
      runtime: runtime(false),
    });
    expect(status).toEqual({ kind: 'missing' });
  });

  it('reports malformed when load emitted cache_malformed', () => {
    const status = resolveFilesIndexStatus({
      prev: defaultProjectFilesState(),
      warnings: [{ code: 'cache_malformed', message: 'bad', path: '/cache/files.json' }],
      filesPath: '/cache/files.json',
      runtime: runtime(true),
    });
    expect(status).toEqual({ kind: 'malformed' });
  });
});
