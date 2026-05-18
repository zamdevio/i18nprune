import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import { scanProjectSourceFiles } from '../projectScan.js';

describe('scanProjectSourceFiles', () => {
  const rt = createNodeRuntimeAdapters();

  it('uses srcRoot-relative displayPath when file is under srcRoot', () => {
    const rows = scanProjectSourceFiles({
      srcRoot: '/repo/src',
      cwd: '/repo',
      path: rt.path,
      listFiles: () => ['/repo/src/a.ts'],
      readFile: () => 'const x = 1;',
      scanFile: ({ displayPath }) => [{ displayPath }],
    });
    expect(rows).toEqual([{ displayPath: 'a.ts' }]);
  });

  it('falls back to cwd-relative displayPath when file is outside srcRoot', () => {
    const rows = scanProjectSourceFiles({
      srcRoot: '/repo/src',
      cwd: '/repo',
      path: rt.path,
      listFiles: () => ['/repo/lib/a.ts'],
      readFile: () => 'const x = 1;',
      scanFile: ({ displayPath }) => [{ displayPath }],
    });
    expect(rows).toEqual([{ displayPath: 'lib/a.ts' }]);
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
    expect(rows).toEqual([{ displayPath: 'b.ts' }]);
  });
});
