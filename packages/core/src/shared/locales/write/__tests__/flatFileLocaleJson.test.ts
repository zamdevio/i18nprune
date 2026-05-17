import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { RuntimeFsPort } from '../../../../types/runtime/fs.js';
import { writeFlatLocaleJsonDocument } from '../flatFileLocaleJson.js';

function captureFs(): { fs: RuntimeFsPort; writes: Array<{ path: string; body: string }>; mkdirs: string[] } {
  const writes: Array<{ path: string; body: string }> = [];
  const mkdirs: string[] = [];
  const fs: RuntimeFsPort = {
    exists: () => false,
    readText: () => {
      throw new Error('not used');
    },
    statKind: () => 'missing',
    listDir: () => [],
    writeText: (p, body) => {
      writes.push({ path: p, body });
    },
    deleteFile: () => {},
    mkdirp: (p) => {
      mkdirs.push(p);
    },
  };
  return { fs, writes, mkdirs };
}

describe('writeFlatLocaleJsonDocument', () => {
  it('mkdirp parent, pretty JSON + trailing newline', () => {
    const { fs, writes, mkdirs } = captureFs();
    const absoluteFile = path.join('/proj', 'locales', 'de.json');
    const res = writeFlatLocaleJsonDocument({
      fs,
      path,
      absoluteFile,
      data: { a: { b: 1 } },
    });
    expect(res.ok).toBe(true);
    expect(mkdirs).toEqual([path.dirname(absoluteFile)]);
    expect(writes).toHaveLength(1);
    expect(writes[0]?.path).toBe(absoluteFile);
    expect(writes[0]?.body).toBe('{\n  "a": {\n    "b": 1\n  }\n}\n');
  });

  it('emits diagnostics on write failure (no throw)', () => {
    const onDiagnostic = vi.fn();
    const fs: RuntimeFsPort = {
      exists: () => false,
      readText: () => {
        throw new Error('not used');
      },
      statKind: () => 'missing',
      listDir: () => [],
      writeText: () => {
        throw new Error('disk full');
      },
      deleteFile: () => {},
      mkdirp: () => {},
    };
    const res = writeFlatLocaleJsonDocument({
      fs,
      path,
      absoluteFile: '/x/y.json',
      data: {},
      onDiagnostic,
    });
    expect(res.ok).toBe(false);
    expect(res.diagnostics[0]?.code).toBe('locale_fs_write_failed');
    expect(onDiagnostic).toHaveBeenCalledTimes(1);
  });
});
