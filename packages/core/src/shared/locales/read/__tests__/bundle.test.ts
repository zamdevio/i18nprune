import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { RuntimeFsPort } from '../../../../types/runtime/fs.js';
import { resolveLocalesLayout } from '../../layout/resolveLayout.js';
import { readLocaleBundle } from '../bundle.js';

function memFs(files: Record<string, string>): RuntimeFsPort {
  return {
    exists: (p) => p in files,
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

describe('readLocaleBundle', () => {
  const layout = resolveLocalesLayout(
    { source: 'locales/en.json', directory: 'locales' },
    '/proj/locales',
  );

  it('reads flat locale file with text', () => {
    const absoluteFile = path.join('/proj/locales', 'en.json');
    const body = JSON.stringify({ a: 'hi' });
    const res = readLocaleBundle({
      layout,
      fs: memFs({ [absoluteFile]: body }),
      path,
      absoluteFile,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.text).toBe(body);
    expect(res.leaves).toHaveLength(1);
  });

  it('returns locale_layout_unsupported for locale_directory', () => {
    const dirLayout = resolveLocalesLayout(
      { source: 'messages/en.json', directory: 'messages', mode: 'locale_directory' },
      '/proj/messages',
    );
    const res = readLocaleBundle({
      layout: dirLayout,
      fs: memFs({}),
      path,
      absoluteFile: '/proj/messages/en/auth.json',
    });
    expect(res.ok).toBe(false);
    expect(res.diagnostics[0]?.code).toBe('locale_layout_unsupported');
  });
});
