import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createNodeRuntimeAdapters, createRuntimeAdaptersForKind } from '../exports/node.js';
import { createWebRuntimeAdapters } from '../exports/web.js';
import { createEdgeRuntimeAdapters } from '../exports/edge.js';
import { assertRuntimeAdapters, assertRuntimeNetworkPort } from '../guards/system.js';
import type { RuntimeDirEntry, RuntimeFsPort } from '../contracts/index.js';

function memoryFs(initial: Record<string, string> = {}): RuntimeFsPort {
  const files = new Map<string, string>(Object.entries(initial));
  const dirs = new Set<string>(['/']);
  return {
    exists: (p) => files.has(p) || dirs.has(p),
    readText: (p) => {
      const v = files.get(p);
      if (v === undefined) throw new Error(`missing: ${p}`);
      return v;
    },
    statKind: (p) => (files.has(p) ? 'file' : dirs.has(p) ? 'directory' : 'missing'),
    listDir: (dirPath) => {
      const prefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
      const names = new Set<string>();
      for (const k of files.keys()) {
        if (k.startsWith(prefix) && k !== prefix) {
          const rest = k.slice(prefix.length);
          const seg = rest.split('/')[0];
          if (seg) names.add(seg);
        }
      }
      return [...names].map((name) => ({ name, kind: 'file' as const }));
    },
    writeText: (p, content) => {
      files.set(p, content);
    },
    deleteFile: (p) => {
      files.delete(p);
    },
    mkdirp: (dirPath) => {
      dirs.add(dirPath.endsWith('/') ? dirPath.slice(0, -1) : dirPath);
    },
  };
}

describe('runtime adapters', () => {
  it('createNodeRuntimeAdapters passes assertRuntimeAdapters and exposes working node ports', async () => {
    const rt = createNodeRuntimeAdapters();
    expect(rt.kind).toBe('node');
    assertRuntimeAdapters(rt);
    expect(typeof rt.system.cwd()).toBe('string');
    expect(typeof rt.system.now()).toBe('number');
    expect(rt.path.join('a', 'b')).toContain('a');
    expect(rt.path.isAbsolute('/abs')).toBe(true);
    expect(typeof rt.network.fetch).toBe('function');

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18nprune-rt-'));
    try {
      const f = path.join(dir, 'x.txt');
      rt.fs.writeText(f, 'ok');
      expect(rt.fs.exists(f)).toBe(true);
      expect(rt.fs.readText(f)).toBe('ok');
      expect(rt.fs.statKind(f)).toBe('file');
      rt.fs.deleteFile(f);
      expect(rt.fs.exists(f)).toBe(false);
      expect(rt.fs.statKind(f)).toBe('missing');
      const entries = await Promise.resolve(rt.fs.listDir(dir));
      expect(entries.some((e: RuntimeDirEntry) => e.name === 'x.txt' && e.kind === 'file')).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('createWebRuntimeAdapters uses injected fs and stable kind', () => {
    const fsPort = memoryFs({ '/project/a.txt': 'hello' });
    const rt = createWebRuntimeAdapters({ fs: fsPort, cwd: '/project' });
    expect(rt.kind).toBe('web');
    assertRuntimeAdapters(rt);
    expect(rt.system.cwd()).toBe('/project');
    expect(rt.fs.readText('/project/a.txt')).toBe('hello');
    rt.fs.writeText('/project/b.txt', 'x');
    expect(rt.fs.readText('/project/b.txt')).toBe('x');
  });

  it('createEdgeRuntimeAdapters matches web shape for injected fs', () => {
    const fsPort = memoryFs({ '/e/x.json': '{}' });
    const rt = createEdgeRuntimeAdapters({ fs: fsPort, cwd: '/e' });
    expect(rt.kind).toBe('edge');
    assertRuntimeAdapters(rt);
    expect(rt.fs.readText('/e/x.json')).toBe('{}');
  });

  it('createRuntimeAdaptersForKind dispatches node vs web', () => {
    const nodeRt = createRuntimeAdaptersForKind('node');
    expect(nodeRt.kind).toBe('node');
    assertRuntimeAdapters(nodeRt);

    const webRt = createRuntimeAdaptersForKind('web', {
      fs: memoryFs({ '/w/t': 't' }),
      cwd: '/w',
    });
    expect(webRt.kind).toBe('web');
    assertRuntimeAdapters(webRt);
    expect(webRt.fs.readText('/w/t')).toBe('t');
  });

  it('createRuntimeAdaptersForKind throws for web without fs', () => {
    expect(() => createRuntimeAdaptersForKind('web', undefined as never)).toThrow(/requires fs adapter/);
  });

  it('assertRuntimeNetworkPort rejects missing fetch', () => {
    expect(() => assertRuntimeNetworkPort({} as never)).toThrow(/fetch/);
  });

  it('assertRuntimeAdapters rejects incomplete adapters', () => {
    expect(() =>
      assertRuntimeAdapters({
        kind: 'node',
        system: { cwd: () => '/', now: () => 1 },
        path: { join: () => '' },
        fs: { exists: () => false, readText: () => '', statKind: () => 'missing' },
        network: { fetch: globalThis.fetch },
      } as unknown as Parameters<typeof assertRuntimeAdapters>[0]),
    ).toThrow();
  });
});
