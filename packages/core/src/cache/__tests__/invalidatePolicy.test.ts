import { describe, expect, it } from 'vitest';
import {
  decideProjectAnalysisCacheInvalidation,
  invalidateProjectAnalysisCacheAfterLocaleWrites,
  getOrBuildCachedProjectData,
  initializeCacheState,
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

describe('decideProjectAnalysisCacheInvalidation', () => {
  const partialConfig = { rebuild: 'partial' as const, fullRescanThresholdPercent: 40 };
  const fullConfig = { rebuild: 'full' as const, fullRescanThresholdPercent: 10 };

  it('skips when only target locale segments were written', () => {
    const d = decideProjectAnalysisCacheInvalidation({
      enabled: true,
      rebuildConfig: partialConfig,
      sourceLocaleSegmentKey: 'en.json',
      mutatedLocaleSegmentKeys: ['fr.json', 'de.json'],
    });
    expect(d).toEqual({ action: 'skip', reason: 'target_locale_writes_only' });
  });

  it('skips when source locale was written and rebuild is partial', () => {
    const d = decideProjectAnalysisCacheInvalidation({
      enabled: true,
      rebuildConfig: partialConfig,
      sourceLocaleSegmentKey: 'en.json',
      mutatedLocaleSegmentKeys: ['en.json'],
    });
    expect(d).toEqual({ action: 'skip', reason: 'locale_writes_dispatch_handles' });
  });

  it('deletes when config rebuild is full', () => {
    const d = decideProjectAnalysisCacheInvalidation({
      enabled: true,
      rebuildConfig: fullConfig,
      sourceLocaleSegmentKey: 'en.json',
      mutatedLocaleSegmentKeys: ['fr.json'],
    });
    expect(d).toEqual({ action: 'delete', reason: 'config_rebuild_full' });
  });

  it('skips when cache is disabled', () => {
    const d = decideProjectAnalysisCacheInvalidation({
      enabled: false,
      rebuildConfig: partialConfig,
      sourceLocaleSegmentKey: 'en.json',
      mutatedLocaleSegmentKeys: ['fr.json'],
    });
    expect(d).toEqual({ action: 'skip', reason: 'cache_disabled' });
  });
});

describe('invalidateProjectAnalysisCacheAfterLocaleWrites', () => {
  it('preserves analysis.json after target-only writes so the next dispatch reuses scan arrays', () => {
    const fs = memoryFs({
      '/project/src/app.ts': 't("app.title")',
      '/project/locales/en.json': '{"app":{"title":"Title"}}',
      '/project/locales/fr.json': '{"app":{"title":"Titre"}}',
    });
    const rt = runtime(fs);
    const { state } = initializeCacheState({ projectRoot: '/project', cacheRootDir: '/cache', runtime: rt });
    let builds = 0;
    const locales = { source: 'locales/en.json', directory: 'locales' };
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

    getOrBuildCachedProjectData(input);
    expect(fs.exists(state.analysisPath)).toBe(true);

    fs.writeText('/project/locales/fr.json', '{"app":{"title":"Titre!"}}');

    const decision = invalidateProjectAnalysisCacheAfterLocaleWrites(state, rt, {
      enabled: true,
      rebuildConfig: { rebuild: 'partial', fullRescanThresholdPercent: 40 },
      sourceLocaleSegmentKey: 'en.json',
      mutatedLocaleSegmentKeys: ['fr.json'],
    });
    expect(decision).toEqual({ action: 'skip', reason: 'target_locale_writes_only' });
    expect(fs.exists(state.analysisPath)).toBe(true);

    const afterSync = getOrBuildCachedProjectData(input);
    expect(afterSync.cache.reason).toBe('files_changed');
    expect(afterSync.cache.analysisRebuild?.strategy).toBe('reuse');
    expect(afterSync.cache.analysisRebuild?.reason).toBe('target_locale_only');
    expect(afterSync.data.builds).toBe(1);
  });

  it('deletes analysis.json when config rebuild is full', () => {
    const fs = memoryFs({
      '/project/src/app.ts': 't("app.title")',
      '/project/locales/en.json': '{"app":{"title":"Title"}}',
      '/project/locales/fr.json': '{"app":{"title":"Titre"}}',
    });
    const rt = runtime(fs);
    const { state } = initializeCacheState({ projectRoot: '/project', cacheRootDir: '/cache', runtime: rt });
    let builds = 0;
    const locales = { source: 'locales/en.json', directory: 'locales' };
    const input: CachedProjectInput<{ builds: number }> = {
      state,
      runtime: rt,
      sourceLocalePath: '/project/locales/en.json',
      srcRoot: '/project/src',
      localesDir: '/project/locales',
      locales,
      producer: () => ({ builds: (builds += 1) }),
      parseCachedData: (data) => ({ ok: true, data: data as { builds: number } }),
      rebuildConfig: { rebuild: 'full', fullRescanThresholdPercent: 10 },
    };

    getOrBuildCachedProjectData(input);
    fs.writeText('/project/locales/fr.json', '{"app":{"title":"Titre!"}}');

    const decision = invalidateProjectAnalysisCacheAfterLocaleWrites(state, rt, {
      enabled: true,
      rebuildConfig: { rebuild: 'full', fullRescanThresholdPercent: 10 },
      sourceLocaleSegmentKey: 'en.json',
      mutatedLocaleSegmentKeys: ['fr.json'],
    });
    expect(decision).toEqual({ action: 'delete', reason: 'config_rebuild_full' });
    expect(fs.exists(state.analysisPath)).toBe(false);
  });
});
