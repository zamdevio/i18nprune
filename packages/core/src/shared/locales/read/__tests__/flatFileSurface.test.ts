import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { RuntimeFsPort } from '../../../../types/runtime/fs.js';
import { readFlatLocaleJsonSurface } from '../flatFileSurface.js';

function memFs(files: Record<string, string>): RuntimeFsPort {
  return {
    exists: (p) => (p in files ? true : false),
    readText: (p) => {
      if (!(p in files)) throw new Error(`ENOENT: no such file ${p}`);
      return files[p]!;
    },
    statKind: (p) => (p in files ? 'file' : 'missing'),
    listDir: () => [],
    writeText: () => {},
    deleteFile: () => {},
    mkdirp: () => {},
  };
}

describe('readFlatLocaleJsonSurface', () => {
  it('returns stamped leaves on success', () => {
    const localesDir = '/proj/locales';
    const absoluteFile = path.join(localesDir, 'en.json');
    const fs = memFs({ [absoluteFile]: JSON.stringify({ a: { b: 'hi' } }) });
    const res = readFlatLocaleJsonSurface({
      fs,
      path,
      absoluteFile,
      localesDir,
      structure: 'locale_file',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.leaves).toHaveLength(1);
    expect(res.leaves[0]?.path).toBe('a.b');
    expect(res.leaves[0]?.fileOrigin?.relativePath).toBe('en.json');
    expect(res.document).toEqual({ a: { b: 'hi' } });
    expect(res.text).toBe(JSON.stringify({ a: { b: 'hi' } }));
    expect(res.diagnostics).toHaveLength(0);
  });

  it('returns ok:false and diagnostics on read failure (no throw)', () => {
    const onDiagnostic = vi.fn();
    const res = readFlatLocaleJsonSurface({
      fs: memFs({}),
      path,
      absoluteFile: '/nope/en.json',
      localesDir: '/nope',
      structure: 'locale_file',
      onDiagnostic,
    });
    expect(res.ok).toBe(false);
    expect(res.leaves).toHaveLength(0);
    expect(res.diagnostics[0]?.code).toBe('locale_fs_read_failed');
    expect(onDiagnostic).toHaveBeenCalledTimes(1);
  });

  it('returns ok:false on invalid JSON', () => {
    const localesDir = '/proj/locales';
    const absoluteFile = path.join(localesDir, 'en.json');
    const fs = memFs({ [absoluteFile]: '{ not json' });
    const res = readFlatLocaleJsonSurface({ fs, path, absoluteFile, localesDir, structure: 'locale_file' });
    expect(res.ok).toBe(false);
    expect(res.diagnostics[0]?.code).toBe('locale_json_parse_failed');
  });
});
