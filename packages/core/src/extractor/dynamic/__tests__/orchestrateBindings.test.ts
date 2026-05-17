import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import { scanProjectDynamicKeySites } from '../orchestrate.js';

describe('scanProjectDynamicKeySites (import bindings)', () => {
  it('detects non-literal calls when t is imported under a local alias', () => {
    const rt = createNodeRuntimeAdapters();
    const srcRoot = '/proj/src';
    const file = path.join(srcRoot, 'app.ts');
    const text = `import { t as translate } from './i18n';\nconst id = 'dyn';\ntranslate(id);\n`;
    const sites = scanProjectDynamicKeySites({
      srcRoot,
      cwd: '/proj',
      path: rt.path,
      readFile: (fp) => (fp === file ? text : ''),
      listFiles: () => [file],
      functions: ['t'],
    });
    expect(sites.some((s) => s.kind === 'non_literal')).toBe(true);
  });
});
