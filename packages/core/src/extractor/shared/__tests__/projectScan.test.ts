import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import { scanProjectSourceFiles } from '../projectScan.js';

describe('scanProjectSourceFiles', () => {
  const rt = createNodeRuntimeAdapters();

  it('uses relative displayPath when file is under cwd', () => {
    const rows = scanProjectSourceFiles({
      srcRoot: '/repo/src',
      cwd: '/repo',
      path: rt.path,
      listFiles: () => ['/repo/src/a.ts'],
      readFile: () => 'const x = 1;',
      scanFile: ({ displayPath }) => [{ displayPath }],
    });
    expect(rows).toEqual([{ displayPath: 'src/a.ts' }]);
  });

  it('falls back to absolute displayPath when file is outside cwd', () => {
    const rows = scanProjectSourceFiles({
      srcRoot: '/repo/src',
      cwd: '/other',
      path: rt.path,
      listFiles: () => ['/repo/src/a.ts'],
      readFile: () => 'const x = 1;',
      scanFile: ({ displayPath }) => [{ displayPath }],
    });
    expect(rows).toEqual([{ displayPath: '/repo/src/a.ts' }]);
  });

  it('skips unreadable files and continues scanning', () => {
    const rows = scanProjectSourceFiles({
      srcRoot: '/repo/src',
      cwd: '/repo',
      path: rt.path,
      listFiles: () => ['/repo/src/a.ts', '/repo/src/b.ts'],
      readFile: (filePath) => {
        if (filePath.endsWith('/a.ts')) throw new Error('boom');
        return 'const y = 2;';
      },
      scanFile: ({ displayPath }) => [{ displayPath }],
    });
    expect(rows).toEqual([{ displayPath: 'src/b.ts' }]);
  });
});
