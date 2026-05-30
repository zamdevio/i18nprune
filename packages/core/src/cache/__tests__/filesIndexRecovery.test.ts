import { describe, expect, it } from 'vitest';
import { getOrBuildCachedProjectData, initializeCacheState } from '../index.js';
import type { CachedProjectInput, CacheRuntime } from '../../types/cache/index.js';
import type { RuntimeDirEntry, RuntimeFsPort, RuntimePathPort } from '../../types/runtime/index.js';

function normalizePath(value: string): string {
  const parts: string[] = [];
  for (const raw of value.replace(/\\/g, '/').split('/')) {
    if (!raw || raw === '.') continue;
    if (raw === '..') {
      parts.pop();
      continue;
    }
    parts.push(raw);
  }
  return `/${parts.join('/')}`;
}

const pathPort: RuntimePathPort = {
  join: (...parts) => normalizePath(parts.join('/')),
  dirname: (value) => {
    const normalized = normalizePath(value);
    const idx = normalized.lastIndexOf('/');
    return idx <= 0 ? '/' : normalized.slice(0, idx);
  },
  basename: (value, ext) => {
    const name = normalizePath(value).split('/').pop() ?? '';
    return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name;
  },
  normalize: normalizePath,
  relative: (from, to) => {
    const fromParts = normalizePath(from).split('/').filter(Boolean);
    const toParts = normalizePath(to).split('/').filter(Boolean);
    while (fromParts.length > 0 && toParts.length > 0 && fromParts[0] === toParts[0]) {
      fromParts.shift();
      toParts.shift();
    }
    return [...fromParts.map(() => '..'), ...toParts].join('/');
  },
  resolve: (...parts) => normalizePath(parts.join('/')),
  isAbsolute: (value) => value.startsWith('/'),
};

function memoryFs(initial: Record<string, string> = {}): RuntimeFsPort {
  const files = new Map<string, string>();
  const dirs = new Set<string>(['/']);
  const ensureDir = (dirPath: string): void => {
    let current = normalizePath(dirPath);
    const chain: string[] = [];
    while (current !== '/' && !dirs.has(current)) {
      chain.push(current);
      current = pathPort.dirname(current);
    }
    for (const dir of chain.reverse()) dirs.add(dir);
  };
  for (const [filePath, content] of Object.entries(initial)) {
    const normalized = normalizePath(filePath);
    ensureDir(pathPort.dirname(normalized));
    files.set(normalized, content);
  }
  return {
    exists: (filePath) => files.has(normalizePath(filePath)) || dirs.has(normalizePath(filePath)),
    readText: (filePath) => {
      const value = files.get(normalizePath(filePath));
      if (value === undefined) throw new Error(`missing ${filePath}`);
      return value;
    },
    statKind: (filePath) => {
      const normalized = normalizePath(filePath);
      if (files.has(normalized)) return 'file';
      if (dirs.has(normalized)) return 'directory';
      return 'missing';
    },
    listDir: (dirPath) => {
      const normalized = normalizePath(dirPath);
      const prefix = normalized === '/' ? '/' : `${normalized}/`;
      const names = new Map<string, RuntimeDirEntry['kind']>();
      for (const filePath of files.keys()) {
        if (!filePath.startsWith(prefix)) continue;
        const rest = filePath.slice(prefix.length);
        if (!rest || rest.includes('/')) continue;
        names.set(rest, 'file');
      }
      return [...names].map(([name, kind]) => ({ name, kind }));
    },
    writeText: (filePath, content) => {
      const normalized = normalizePath(filePath);
      ensureDir(pathPort.dirname(normalized));
      files.set(normalized, content);
    },
    deleteFile: (filePath) => {
      files.delete(normalizePath(filePath));
    },
    mkdirp: ensureDir,
  };
}

function runtime(fs: RuntimeFsPort): CacheRuntime {
  return {
    fs,
    path: pathPort,
    system: { cwd: () => '/project', now: () => 1_700_000_000_000 },
    hashText: (text) => `h-${text}`,
    byteLength: (text) => text.length,
  };
}

describe('files index recovery', () => {
  it('reuses analysis when files.json is missing but analysis epoch still matches', () => {
    const fs = memoryFs({
      '/project/src/app.ts': 't("app.title")',
      '/project/locales/en.json': '{"app":{"title":"Title"}}',
    });
    const rt = runtime(fs);
    const { state } = initializeCacheState({ projectRoot: '/project', cacheRootDir: '/cache', runtime: rt });
    let builds = 0;
    const locales = { source: 'en', directory: 'locales' };
    const input: CachedProjectInput<{ builds: number }> = {
      state,
      runtime: rt,
      sourceLocalePath: '/project/locales/en.json',
      srcRoot: '/project/src',
      localesDir: '/project/locales',
      locales,
      producer: () => ({ builds: (builds += 1) }),
      parseCachedData: (data: unknown) =>
        typeof data === 'object' && data !== null && typeof (data as { builds?: unknown }).builds === 'number'
          ? { ok: true as const, data: data as { builds: number } }
          : { ok: false as const },
    };

    getOrBuildCachedProjectData(input);
    expect(builds).toBe(1);
    fs.deleteFile(state.filesPath);

    const recovered = getOrBuildCachedProjectData(input);
    expect(recovered.cache.status).toBe('hit');
    expect(recovered.cache.reason).toBe('files_index_recovered');
    expect(recovered.cache.analysisRebuild?.strategy).toBe('reuse');
    expect(recovered.data.builds).toBe(1);
    expect(builds).toBe(1);
    expect(fs.exists(state.filesPath)).toBe(true);
  });
});
