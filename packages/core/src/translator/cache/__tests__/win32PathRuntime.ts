import path from 'node:path';
import type { CacheRuntime, CacheState } from '../../../types/cache/index.js';
import type { RuntimeFsPort, RuntimePathPort } from '../../../types/runtime/index.js';

const DIR_MARKER = '__dir__';

function win32PathPort(): RuntimePathPort {
  const win32 = path.win32;
  return {
    join: (...parts: string[]) => win32.join(...parts),
    dirname: (value: string) => win32.dirname(value),
    basename: (value: string, ext?: string) => win32.basename(value, ext),
    normalize: (value: string) => win32.normalize(value),
    relative: (from: string, to: string) => win32.relative(from, to),
    resolve: (...parts: string[]) => win32.resolve(...parts),
    isAbsolute: (value: string) => win32.isAbsolute(value),
  };
}

function win32MemoryFs(initial: Record<string, string> = {}): RuntimeFsPort {
  const win32 = path.win32;
  const store = new Map<string, string>();
  for (const [filePath, content] of Object.entries(initial)) {
    store.set(win32.normalize(filePath), content);
  }

  return {
    exists: (filePath: string) => store.has(win32.normalize(filePath)),
    statKind: (filePath: string) => {
      const normalized = win32.normalize(filePath);
      const value = store.get(normalized);
      if (value === DIR_MARKER) return 'directory';
      return value !== undefined ? 'file' : 'missing';
    },
    readText: (filePath: string) => store.get(win32.normalize(filePath)) ?? '',
    writeText: (filePath: string, text: string) => {
      store.set(win32.normalize(filePath), text);
    },
    mkdirp: (dirPath: string) => {
      store.set(win32.normalize(dirPath), DIR_MARKER);
    },
    deleteFile: (filePath: string) => {
      store.delete(win32.normalize(filePath));
    },
    listDir: (dirPath: string) => {
      const dir = win32.normalize(dirPath);
      const prefix = dir.endsWith(win32.sep) ? dir : `${dir}${win32.sep}`;
      const names = new Set<string>();
      for (const key of store.keys()) {
        if (!key.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length);
        if (!rest || rest.includes(win32.sep)) continue;
        if (store.get(key) === DIR_MARKER) continue;
        names.add(rest);
      }
      return [...names].map((name) => ({ kind: 'file' as const, name }));
    },
  };
}

/**
 * In-memory cache runtime with Win32 `path.join` semantics (runs on any host OS).
 * Use to assert translate-cache heal/open paths do not assume POSIX `/`.
 */
export function createWin32MemoryCacheRuntime(files: Record<string, string> = {}): CacheRuntime {
  const pathPort = win32PathPort();
  const fs = win32MemoryFs(files);
  return {
    fs,
    path: pathPort,
    system: { now: () => 1_700_000_000_000, cwd: () => 'C:\\project' },
    hashText: (text: string) => `hash:${text}`,
    byteLength: (text: string) => new TextEncoder().encode(text).length,
  };
}

export function win32CacheState(projectDir: string): CacheState {
  const translationsDir = path.win32.join(projectDir, 'translations');
  return {
    enabled: true,
    reason: 'default',
    rootDir: 'C:\\Users\\me\\.i18nprune\\cache',
    metaPath: 'C:\\Users\\me\\.i18nprune\\cache\\meta.json',
    projectId: 'proj',
    projectRoot: 'C:\\repo',
    projectDir,
    filesPath: path.win32.join(projectDir, 'files.json'),
    analysisPath: path.win32.join(projectDir, 'analysis.json'),
    translationsDir,
    readOnly: false,
  };
}
