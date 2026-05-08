import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import { scanProjectLiteralKeyUsage } from '../projectUsage.js';

describe('scanProjectLiteralKeyUsage', () => {
  it('scans files and returns folded resolved/uncertain usage sets', () => {
    const rt = createNodeRuntimeAdapters();
    const usage = scanProjectLiteralKeyUsage({
      srcRoot: '/repo/src',
      functions: ['t'],
      cwd: '/repo',
      path: rt.path,
      listFiles: () => ['/repo/src/a.ts', '/repo/src/b.ts'],
      readFile: (filePath) => {
        if (filePath.endsWith('/a.ts')) {
          return "const NS = 'app'; t(`${NS}.home.title`)";
        }
        return "const SHOP = 'shop'; t(`${SHOP}.${id}.label`)";
      },
    });

    expect(usage.resolvedKeys.has('app.home.title')).toBe(true);
    expect(usage.uncertainPrefixes.size).toBe(0);
    expect(usage.usedRoots.has('app')).toBe(true);
    expect(usage.usedRoots.has('shop')).toBe(false);
  });
});
