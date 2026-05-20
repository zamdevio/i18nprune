import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_SHARE_JSON_BYTES,
  loadShareJsonFile,
  mergeDuplicateShareEntries,
  resolveShareJsonPath,
  saveShareJsonFile,
} from '../../cache/io/shareJson.js';
import { ISSUE_SHARE_JSON_REPAIRED, ISSUE_SHARE_JSON_WRITE_FAILED } from '../../../shared/constants/issueCodes.js';
import type { CacheRuntime } from '../../../types/cache/index.js';
import type { RuntimeDirEntry, RuntimeFsPort, RuntimePathPort } from '../../../types/runtime/index.js';
import type { ShareCacheEntry } from '../../../types/share/index.js';

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
    listDir: (): RuntimeDirEntry[] => [],
    writeText: (filePath, content) => {
      const normalized = normalizePath(filePath);
      ensureDir(dirname(normalized));
      files.set(normalized, content);
    },
    deleteFile: (filePath) => {
      files.delete(normalizePath(filePath));
    },
    mkdirp: (dirPath) => {
      dirs.add(normalizePath(dirPath));
    },
  };
}

function testRuntime(fs: RuntimeFsPort): CacheRuntime {
  return {
    fs,
    path: pathPort,
    system: { now: () => 1_700_000_000_000, cwd: () => '/' },
    byteLength: (t) => new TextEncoder().encode(t).length,
  };
}

describe('shareJson', () => {
  it('loadShareJsonFile: missing file yields empty entries and no issues', () => {
    const fs = memoryFs();
    const sharePath = '/cache/projects/p1/share.json';
    const out = loadShareJsonFile({ sharePath, runtime: testRuntime(fs) });
    expect(out.file.entries).toEqual([]);
    expect(out.issues).toHaveLength(0);
    expect(out.heal.actions).toContain('missing_file');
    expect(out.heal.repaired).toBe(false);
  });

  it('loadShareJsonFile: strips unknown top-level keys and emits repair issue', () => {
    const raw = JSON.stringify({ version: 1, entries: [], extra: 1 });
    const fs = memoryFs({ '/cache/projects/p1/share.json': raw });
    const sharePath = '/cache/projects/p1/share.json';
    const out = loadShareJsonFile({ sharePath, runtime: testRuntime(fs) });
    expect(out.file).toEqual({ version: 1, entries: [] });
    expect(out.issues.some((i) => i.code === ISSUE_SHARE_JSON_REPAIRED)).toBe(true);
    expect(out.heal.repaired).toBe(true);
  });

  it('loadShareJsonFile: report rows persist with workerReportId only (no repair loop)', () => {
    const sharePath = '/cache/projects/p1/share.json';
    const fs = memoryFs();
    const runtime = testRuntime(fs);
    saveShareJsonFile({
      sharePath,
      runtime,
      file: {
        version: 1,
        entries: [
          {
            kind: 'report',
            workerBaseUrl: 'https://w.example',
            workerReportId: 'r1',
            payloadContentHash: 'h1',
            byteSize: 1,
            uploadedAt: '2020-01-01T00:00:00.000Z',
            lastUsedAt: '2020-01-02T00:00:00.000Z',
            links: {},
          },
        ],
      },
    });
    const reload = loadShareJsonFile({ sharePath, runtime });
    expect(reload.issues).toHaveLength(0);
    expect(reload.heal.repaired).toBe(false);
    expect(reload.file.entries[0]).toMatchObject({ kind: 'report', workerReportId: 'r1' });
    expect(reload.file.entries[0]).not.toHaveProperty('workerProjectId');
  });

  it('loadShareJsonFile: persists healed share.json to disk', () => {
    const raw = JSON.stringify({
      version: 1,
      entries: [
        {
          kind: 'project',
          workerBaseUrl: 'https://w.example',
          workerReportId: 'pid1',
          payloadContentHash: 'h1',
          byteSize: 1,
          uploadedAt: '2020-01-01T00:00:00.000Z',
          lastUsedAt: '2020-01-02T00:00:00.000Z',
          links: {},
        },
        { kind: 'project', workerBaseUrl: 'x' },
      ],
    });
    const sharePath = '/cache/projects/p1/share.json';
    const fs = memoryFs({ [sharePath]: raw });
    const runtime = testRuntime(fs);
    const out = loadShareJsonFile({ sharePath, runtime });
    expect(out.file.entries).toHaveLength(1);
    expect(out.file.entries[0]?.workerProjectId).toBe('pid1');
    expect(out.issues.some((i) => i.code === ISSUE_SHARE_JSON_REPAIRED)).toBe(true);

    const reload = loadShareJsonFile({ sharePath, runtime });
    expect(reload.issues).toHaveLength(0);
    expect(reload.heal.repaired).toBe(false);
    expect(reload.file.entries).toHaveLength(1);
    expect(reload.file.entries[0]?.workerProjectId).toBe('pid1');
  });

  it('loadShareJsonFile: drops invalid entry rows', () => {
    const raw = JSON.stringify({
      version: 1,
      entries: [
        {
          kind: 'project',
          workerBaseUrl: 'https://w.example',
          workerProjectId: 'abc',
          payloadContentHash: 'h1',
          byteSize: 1,
          uploadedAt: '2020-01-01T00:00:00.000Z',
          lastUsedAt: '2020-01-02T00:00:00.000Z',
          links: {},
        },
        { kind: 'project', workerBaseUrl: 'x' },
      ],
    });
    const fs = memoryFs({ '/cache/projects/p1/share.json': raw });
    const out = loadShareJsonFile({ sharePath: '/cache/projects/p1/share.json', runtime: testRuntime(fs) });
    expect(out.file.entries).toHaveLength(1);
    expect(out.file.entries[0]?.workerProjectId).toBe('abc');
    expect(out.issues.some((i) => i.code === ISSUE_SHARE_JSON_REPAIRED)).toBe(true);
  });

  it('mergeDuplicateShareEntries keeps newest lastUsedAt', () => {
    const a: ShareCacheEntry = {
      kind: 'project',
      workerBaseUrl: 'https://w',
      workerProjectId: 'p1',
      payloadContentHash: 'h',
      byteSize: 1,
      uploadedAt: '2020-01-01T00:00:00.000Z',
      lastUsedAt: '2020-01-01T00:00:00.000Z',
      links: {},
    };
    const b: ShareCacheEntry = { ...a, lastUsedAt: '2021-01-01T00:00:00.000Z', byteSize: 2 };
    const { entries, merged } = mergeDuplicateShareEntries([a, b]);
    expect(merged).toBe(1);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.lastUsedAt).toBe('2021-01-01T00:00:00.000Z');
    expect(entries[0]?.byteSize).toBe(2);
  });

  it('resolveShareJsonPath joins basename', () => {
    expect(resolveShareJsonPath('/cache/projects/x', pathPort)).toBe('/cache/projects/x/share.json');
  });

  it('saveShareJsonFile writes atomic JSON', () => {
    const fs = memoryFs();
    const rt = testRuntime(fs);
    const sharePath = '/cache/projects/p1/share.json';
    const w = saveShareJsonFile({
      sharePath,
      file: { version: 1, entries: [] },
      runtime: rt,
    });
    expect(w.warning).toBeUndefined();
    expect(fs.exists(sharePath)).toBe(true);
    const parsed = JSON.parse(fs.readText(sharePath) as string) as { version: number };
    expect(parsed.version).toBe(1);
  });

  it('backs up invalid JSON raw bytes under share.bak/', () => {
    const raw = '{ not-valid-json';
    const sharePath = '/cache/projects/p1/share.json';
    const fs = memoryFs({ [sharePath]: raw });
    const rt = testRuntime(fs);
    const prevNow = rt.system.now;
    rt.system.now = () => 99_001;
    const out = loadShareJsonFile({ sharePath, runtime: rt });
    rt.system.now = prevNow;
    const bakPath = '/cache/projects/p1/share.bak/share.json.bak.99001.json';
    expect(out.heal.backupBakPath).toBe(bakPath);
    expect(fs.exists(bakPath)).toBe(true);
    expect(fs.readText(bakPath)).toBe(raw);
    expect(out.issues.some((i) => i.code === ISSUE_SHARE_JSON_REPAIRED)).toBe(true);
  });

  it('saveShareJsonFile backs up existing file under share.bak/', () => {
    const sharePath = '/cache/projects/p1/share.json';
    const fs = memoryFs({ [sharePath]: '{"version":1,"entries":[]}' });
    const rt = testRuntime(fs);
    rt.system.now = () => 42_000;
    const w = saveShareJsonFile({
      sharePath,
      file: {
        version: 1,
        entries: [
          {
            kind: 'project',
            workerBaseUrl: 'https://w',
            workerProjectId: 'p1',
            payloadContentHash: 'h',
            byteSize: 1,
            uploadedAt: '2020-01-01T00:00:00.000Z',
            lastUsedAt: '2020-01-01T00:00:00.000Z',
            links: {},
          },
        ],
      },
      runtime: rt,
    });
    expect(w.backupBakPath).toBe('/cache/projects/p1/share.bak/share.json.bak.42000.json');
    expect(fs.readText(w.backupBakPath!)).toBe('{"version":1,"entries":[]}');
  });

  it('respects maxBytes on read', () => {
    const huge = 'x'.repeat(DEFAULT_MAX_SHARE_JSON_BYTES + 10);
    const fs = memoryFs({ '/cache/projects/p1/share.json': `{"version":1,"entries":[],"pad":"${huge}"}` });
    const out = loadShareJsonFile({
      sharePath: '/cache/projects/p1/share.json',
      runtime: testRuntime(fs),
      maxBytes: 64,
    });
    expect(out.file.entries).toEqual([]);
    expect(out.issues.some((i) => i.code === ISSUE_SHARE_JSON_REPAIRED)).toBe(true);
  });
});

describe('saveShareJsonFile errors', () => {
  it('returns write issue when mkdirp throws', () => {
    const fs = memoryFs();
    const badFs: RuntimeFsPort = {
      ...fs,
      mkdirp: () => {
        throw new Error('no disk');
      },
    };
    const w = saveShareJsonFile({
      sharePath: '/nested/p/share.json',
      file: { version: 1, entries: [] },
      runtime: testRuntime(badFs),
    });
    expect(w.warning?.code).toBe(ISSUE_SHARE_JSON_WRITE_FAILED);
  });
});
