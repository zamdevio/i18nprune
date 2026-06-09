import { describe, expect, it } from 'vitest';
import {
  getOrBuildCachedProjectData,
  initializeCacheState,
  prepareCacheForRun,
} from '../index.js';
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

function dirname(value: string): string {
  const normalized = normalizePath(value);
  const idx = normalized.lastIndexOf('/');
  return idx <= 0 ? '/' : normalized.slice(0, idx);
}

function basename(value: string, ext?: string): string {
  const name = normalizePath(value).split('/').pop() ?? '';
  return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name;
}

const pathPort: RuntimePathPort = {
  join: (...parts) => normalizePath(parts.join('/')),
  dirname,
  basename,
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
      current = dirname(current);
    }
    for (const dir of chain.reverse()) dirs.add(dir);
  };
  for (const [filePath, content] of Object.entries(initial)) {
    const normalized = normalizePath(filePath);
    ensureDir(dirname(normalized));
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
      for (const dir of dirs) {
        if (!dir.startsWith(prefix) || dir === normalized) continue;
        const rest = dir.slice(prefix.length);
        if (!rest || rest.includes('/')) continue;
        names.set(rest, 'directory');
      }
      return [...names].map(([name, kind]) => ({ name, kind }));
    },
    writeText: (filePath, content) => {
      const normalized = normalizePath(filePath);
      ensureDir(dirname(normalized));
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

describe('core cache runtime', () => {
  it('initializes and prepares cache using only runtime adapters', () => {
    const fs = memoryFs({ '/project/src/app.ts': 't("app.title")', '/project/locales/en.json': '{"app":{"title":"Title"}}' });
    fs.mkdirp('/cache');
    const rt = runtime(fs);
    const { state, warnings } = initializeCacheState({ projectRoot: '/project', cacheRootDir: '/cache', runtime: rt });
    expect(warnings).toEqual([]);
    expect(state.projectDir).toContain('/cache/projects/');

    const prepared = prepareCacheForRun(state, rt);
    expect(prepared.warnings).toEqual([]);
    expect(fs.exists(state.metaPath)).toBe(true);
  });

  it('misses once, then serves cached data until inputs change', () => {
    const fs = memoryFs({ '/project/src/app.ts': 't("app.title")', '/project/locales/en.json': '{"app":{"title":"Title"}}' });
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

    expect(getOrBuildCachedProjectData(input).cache.status).toBe('miss');
    const hit = getOrBuildCachedProjectData(input);
    expect(hit.cache.status).toBe('hit');
    expect(hit.data.builds).toBe(1);

    fs.writeText('/project/src/app.ts', 't("app.changed")');
    const changed = getOrBuildCachedProjectData(input);
    expect(changed.cache.reason).toBe('files_changed');
    expect(changed.data.builds).toBe(2);
  });

  it('misses when analysis envelope exists but inputFilesEpoch binding is missing', () => {
    const fs = memoryFs({ '/project/src/app.ts': 't("app.title")', '/project/locales/en.json': '{"app":{"title":"Title"}}' });
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

    expect(getOrBuildCachedProjectData(input).cache.status).toBe('miss');
    const hit = getOrBuildCachedProjectData(input);
    expect(hit.cache.status).toBe('hit');

    const raw = JSON.parse(fs.readText(state.analysisPath) as string) as { inputFilesEpoch?: string };
    delete raw.inputFilesEpoch;
    fs.writeText(state.analysisPath, JSON.stringify(raw));

    const stale = getOrBuildCachedProjectData(input);
    expect(stale.cache.status).toBe('miss');
    expect(stale.cache.reason).toBe('run_binding_stale');
    expect(stale.cache.inputFilesEpochDebug?.current).toBeDefined();
    expect(stale.data.builds).toBe(2);
  });

  it('indexes locale segments in files.json and misses when a target locale changes', () => {
    const fs = memoryFs({
      '/project/src/app.ts': 't("app.title")',
      '/project/locales/en.json': '{"app":{"title":"Title"}}',
      '/project/locales/fr.json': '{"app":{"title":"Titre"}}',
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
      parseCachedData: (data) => ({ ok: true, data: data as { builds: number } }),
    };

    expect(getOrBuildCachedProjectData(input).cache.status).toBe('miss');
    const index = JSON.parse(fs.readText(state.filesPath) as string) as {
      files: Record<string, unknown>;
      localeSegments: Record<string, unknown>;
      localesLayout: { mode: string; structure: string };
    };
    expect(index.localesLayout).toEqual({
      mode: 'flat_file',
      structure: 'locale_file',
      directory: 'locales',
      source: 'en',
    });
    expect(index.localeSegments).toHaveProperty('en.json');
    expect(index.localeSegments).toHaveProperty('fr.json');
    expect(index.files).not.toHaveProperty('__source_locale__');

    const hit = getOrBuildCachedProjectData(input);
    expect(hit.cache.status).toBe('hit');

    fs.writeText('/project/locales/fr.json', '{"app":{"title":"Titre!"}}');
    const localeChanged = getOrBuildCachedProjectData(input);
    expect(localeChanged.cache.reason).toBe('files_changed');
    expect(localeChanged.cache.analysisRebuild?.strategy).toBe('reuse');
    expect(localeChanged.cache.analysisRebuild?.reason).toBe('target_locale_only');
    expect(localeChanged.data.builds).toBe(1);
  });

  it('rescans locale segments only when localesLayout changes (reuses src file index)', () => {
    const fs = memoryFs({
      '/project/src/app.ts': 't("app.title")',
      '/project/locales/en.json': '{"app":{"title":"Title"}}',
    });
    const rt = runtime(fs);
    const { state } = initializeCacheState({ projectRoot: '/project', cacheRootDir: '/cache', runtime: rt });
    let builds = 0;
    const flatLocales = { source: 'en', directory: 'locales' };
    const inputFlat: CachedProjectInput<{ builds: number }> = {
      state,
      runtime: rt,
      sourceLocalePath: '/project/locales/en.json',
      srcRoot: '/project/src',
      localesDir: '/project/locales',
      locales: flatLocales,
      producer: () => ({ builds: (builds += 1) }),
    };

    getOrBuildCachedProjectData(inputFlat);
    const srcHashBefore = (
      JSON.parse(fs.readText(state.filesPath) as string) as { files: Record<string, { hash: string }> }
    ).files['app.ts']!.hash;

    fs.writeText('/project/src/app.ts', 't("app.title")');
    const dirLocales = {
      source: 'en',
      directory: 'messages',
      mode: 'locale_directory' as const,
      structure: 'locale_per_dir' as const,
    };
    fs.mkdirp('/project/messages/en');
    fs.writeText('/project/messages/en/common.json', '{"app":{"title":"Title"}}');

    const inputDir: CachedProjectInput<{ builds: number }> = {
      ...inputFlat,
      sourceLocalePath: '/project/messages/en/common.json',
      localesDir: '/project/messages',
      locales: dirLocales,
    };

    const layoutChanged = getOrBuildCachedProjectData(inputDir);
    expect(layoutChanged.cache.reason).toBe('files_changed');
    const index = JSON.parse(fs.readText(state.filesPath) as string) as {
      files: Record<string, { hash: string }>;
      localeSegments: Record<string, unknown>;
      localesLayout: { mode: string; structure: string };
    };
    expect(index.localesLayout.mode).toBe('locale_directory');
    expect(index.localeSegments).toHaveProperty('en/common.json');
    expect(index.files['app.ts']!.hash).toBe(srcHashBefore);
  });

  it('persists enriched analysis payload with counts and missingKeys', () => {
    const fs = memoryFs({
      '/project/src/app.ts': 't("app.title")',
      '/project/locales/en.json': '{"app":{"title":"Title"},"other":"x"}',
    });
    const rt = runtime(fs);
    const { state } = initializeCacheState({ projectRoot: '/project', cacheRootDir: '/cache', runtime: rt });
    const locales = { source: 'en', directory: 'locales' };
    type Payload = {
      version: 1;
      keyObservations: unknown[];
      dynamicSites: unknown[];
      missingKeys: string[];
      counts: {
        keyObservations: number;
        dynamicSites: number;
        dynamicActive: number;
        dynamicCommented: number;
        sourceFilesScanned: number;
        missingKeys: number;
      };
    };
    const payload: Payload = {
      version: 1,
      keyObservations: [{ path: 'app.title' }],
      dynamicSites: [],
      missingKeys: [],
      counts: {
        keyObservations: 1,
        dynamicSites: 0,
        dynamicActive: 0,
        dynamicCommented: 0,
        sourceFilesScanned: 1,
        missingKeys: 0,
      },
    };
    const input: CachedProjectInput<Payload> = {
      state,
      runtime: rt,
      sourceLocalePath: '/project/locales/en.json',
      srcRoot: '/project/src',
      localesDir: '/project/locales',
      locales,
      producer: () => payload,
      parseCachedData: (data: unknown) =>
        typeof data === 'object' && data !== null && (data as Payload).version === 1
          ? { ok: true as const, data: data as Payload }
          : { ok: false as const },
    };

    getOrBuildCachedProjectData(input);
    const envelope = JSON.parse(fs.readText(state.analysisPath) as string) as { data: Payload };
    expect(envelope.data.counts).toEqual(payload.counts);
    expect(envelope.data.missingKeys).toEqual([]);
    expect(envelope.data.keyObservations).toHaveLength(1);
  });
});
