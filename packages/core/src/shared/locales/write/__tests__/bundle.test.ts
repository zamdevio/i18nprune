import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RuntimeFsPort } from '../../../../types/runtime/fs.js';
import { resolveLocalesLayout } from '../../layout/resolveLayout.js';
import { writeLocaleBundle } from '../bundle.js';

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

describe('writeLocaleBundle', () => {
  it('writes flat locale_file segment', () => {
    const layout = resolveLocalesLayout(
      { source: 'en', directory: 'locales' },
      '/proj/locales',
    );
    const absoluteFile = path.join('/proj/locales', 'de.json');
    const { fs, writes } = captureFs();
    const res = writeLocaleBundle({
      layout,
      fs,
      path,
      absoluteFile,
      data: { hello: 'Hallo' },
    });
    expect(res.ok).toBe(true);
    expect(writes[0]?.path).toBe(absoluteFile);
  });

  it('warn-skips on layout path mismatch', () => {
    const layout = resolveLocalesLayout(
      { source: 'en', directory: 'locales' },
      '/proj/locales',
    );
    const res = writeLocaleBundle({
      layout,
      fs: captureFs().fs,
      path,
      absoluteFile: '/proj/locales/en/nested.json',
      data: {},
    });
    expect(res.ok).toBe(false);
    expect(res.diagnostics[0]?.code).toBe('locale_write_path_layout_mismatch');
    expect(res.diagnostics[0]?.level).toBe('warn');
  });

  it('writes locale_directory + locale_per_dir segment paths', () => {
    const layout = resolveLocalesLayout(
      { source: 'en', directory: 'messages', mode: 'locale_directory', structure: 'locale_per_dir' },
      '/proj/messages',
    );
    const absoluteFile = '/proj/messages/fr/auth.json';
    const { fs, writes, mkdirs } = captureFs();
    const res = writeLocaleBundle({
      layout,
      fs,
      path,
      absoluteFile,
      data: { title: 'Auth' },
    });
    expect(res.ok).toBe(true);
    expect(writes[0]?.path).toBe(absoluteFile);
    expect(mkdirs).toEqual([path.dirname(absoluteFile)]);
  });

  it('writes locale_directory + feature_bundle segment paths', () => {
    const layout = resolveLocalesLayout(
      {
        source: 'en',
        directory: 'locales',
        mode: 'locale_directory',
        structure: 'feature_bundle',
      },
      '/proj/locales',
    );
    const absoluteFile = '/proj/locales/auth/fr.json';
    const { fs, writes } = captureFs();
    const res = writeLocaleBundle({
      layout,
      fs,
      path,
      absoluteFile,
      data: { title: 'Auth FR' },
    });
    expect(res.ok).toBe(true);
    expect(writes[0]?.path).toBe(absoluteFile);
  });

  it('rejects unsupported layout combinations', () => {
    const layout = resolveLocalesLayout(
      { source: 'en', directory: 'locales', mode: 'flat_file', structure: 'locale_per_dir' },
      '/proj/locales',
    );
    const res = writeLocaleBundle({
      layout,
      fs: captureFs().fs,
      path,
      absoluteFile: '/proj/locales/en.json',
      data: {},
    });
    expect(res.ok).toBe(false);
    expect(res.diagnostics[0]?.code).toBe('locale_layout_unsupported');
  });
});
