import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import { scanProjectKeyObservations } from '../orchestrate.js';

describe('scanProjectKeyObservations (import bindings)', () => {
  it('finds literal keys when translation fn is imported under a local alias', () => {
    const rt = createNodeRuntimeAdapters();
    const srcRoot = '/proj/src';
    const file = path.join(srcRoot, 'app.ts');
    const text = `import { t as translate } from './i18n';\ntranslate('alias.literal.key');\n`;
    const obs = scanProjectKeyObservations({
      srcRoot,
      cwd: '/proj',
      path: rt.path,
      readFile: (fp) => (fp === file ? text : ''),
      listFiles: () => [file],
      functions: ['t'],
    });
    const lit = obs.find((o) => o.kind === 'literal');
    expect(lit?.kind).toBe('literal');
    if (lit?.kind === 'literal') expect(lit.resolvedKey).toBe('alias.literal.key');
  });
});
