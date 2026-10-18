import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import { scanProjectDynamicKeySites } from '../../dynamic/orchestrate.js';
import { scanProjectKeyObservations } from '../../keySites/orchestrate.js';
import {
  buildProjectExportConstIndex,
  importedConstsForFile,
  resolveModulePath,
} from '../index.js';

const rt = createNodeRuntimeAdapters();

function projectInput(files: Record<string, string>) {
  return {
    srcRoot: '/repo/src',
    cwd: '/repo',
    functions: ['t'],
    runtime: rt,
    listFiles: () => Object.keys(files),
    readFile: (p: string) => files[p]!,
  } as never;
}

describe('buildProjectExportConstIndex', () => {
  it('indexes static exported string consts and skips templated ones', () => {
    const index = buildProjectExportConstIndex(
      [
        {
          filePath: '/repo/src/constants.ts',
          text: `export const NS = 'app';\nexport const ROUTES = 'seo.routes';\nexport const T = \`\${NS}.x\`;\n`,
        },
      ],
      rt.path,
    );
    expect(index.get('/repo/src/constants.ts')).toEqual({ NS: 'app', ROUTES: 'seo.routes' });
  });

  it('follows re-exports (barrel) up to two hops', () => {
    const index = buildProjectExportConstIndex(
      [
        { filePath: '/repo/src/constants.ts', text: `export const NS = 'app';\n` },
        { filePath: '/repo/src/barrel.ts', text: `export { NS } from './constants';\n` },
        { filePath: '/repo/src/root.ts', text: `export { NS } from './barrel';\n` },
      ],
      rt.path,
    );
    expect(index.get('/repo/src/barrel.ts')).toEqual({ NS: 'app' });
    expect(index.get('/repo/src/root.ts')).toEqual({ NS: 'app' });
  });

  it('resolves extension-less specifiers and index files', () => {
    const index = buildProjectExportConstIndex(
      [
        { filePath: '/repo/src/constants.ts', text: `export const A = 'a';\n` },
        { filePath: '/repo/src/dir/index.ts', text: `export const B = 'b';\n` },
      ],
      rt.path,
    );
    expect(resolveModulePath('/repo/src/page.tsx', './constants', index, rt.path)).toBe(
      '/repo/src/constants.ts',
    );
    expect(resolveModulePath('/repo/src/page.tsx', './dir', index, rt.path)).toBe(
      '/repo/src/dir/index.ts',
    );
    expect(resolveModulePath('/repo/src/page.tsx', 'react', index, rt.path)).toBeNull();
  });
});

describe('importedConstsForFile', () => {
  const index = buildProjectExportConstIndex(
    [{ filePath: '/repo/src/constants.ts', text: `export const NS = 'app';\n` }],
    rt.path,
  );

  it('maps a named import to its exported value', () => {
    expect(
      importedConstsForFile(
        `import { NS } from './constants';\nt(\`\${NS}.x\`);`,
        '/repo/src/page.tsx',
        index,
        rt.path,
      ),
    ).toEqual({ NS: 'app' });
  });

  it('maps an aliased import to the local name', () => {
    expect(
      importedConstsForFile(
        `import { NS as NS2 } from './constants';`,
        '/repo/src/page.tsx',
        index,
        rt.path,
      ),
    ).toEqual({ NS2: 'app' });
  });

  it('ignores type-only imports and unknown exports', () => {
    expect(
      importedConstsForFile(
        `import type { NS } from './constants';\nimport { NOPE } from './constants';`,
        '/repo/src/page.tsx',
        index,
        rt.path,
      ),
    ).toEqual({});
  });
});

describe('cross-file resolution end-to-end (dynamic scan)', () => {
  it('folds an imported static const like a same-file const', () => {
    const sites = scanProjectDynamicKeySites(
      projectInput({
        '/repo/src/constants.ts': `export const NS = 'app';\n`,
        '/repo/src/page.tsx': `import { NS } from './constants';\nt(\`\${NS}.title\`);\n`,
      }),
    );
    // Fully resolved → no dynamic site remains.
    expect(sites).toEqual([]);
  });

  it('keeps an unknown import dynamic', () => {
    const sites = scanProjectDynamicKeySites(
      projectInput({
        '/repo/src/constants.ts': `export const NS = 'app';\n`,
        '/repo/src/page.tsx': `import { NOPE } from './constants';\nt(\`\${NOPE}.title\`);\n`,
      }),
    );
    expect(sites.some((s) => s.kind === 'template_interpolation')).toBe(true);
  });

  it('keeps colliding names independent per file (no global merge)', () => {
    const sites = scanProjectDynamicKeySites(
      projectInput({
        '/repo/src/a/constants.ts': `export const NS = 'appA';\n`,
        '/repo/src/b/constants.ts': `export const NS = 'appB';\n`,
        '/repo/src/a/page.tsx': `import { NS } from './constants';\nt(\`\${NS}.x\`);\n`,
        '/repo/src/b/page.tsx': `import { NS } from './constants';\nt(\`\${NS}.x\`);\n`,
      }),
    );
    // Both resolve to their own module's NS → no dynamic sites either side.
    expect(sites).toEqual([]);
  });

  it('folds through a barrel re-export', () => {
    const sites = scanProjectDynamicKeySites(
      projectInput({
        '/repo/src/constants.ts': `export const NS = 'app';\n`,
        '/repo/src/barrel.ts': `export { NS } from './constants';\n`,
        '/repo/src/page.tsx': `import { NS } from './barrel';\nt(\`\${NS}.y\`);\n`,
      }),
    );
    expect(sites).toEqual([]);
  });

  it('records the imported const as a resolved key observation', () => {
    const obs = scanProjectKeyObservations(
      projectInput({
        '/repo/src/constants.ts': `export const NS = 'app';\n`,
        '/repo/src/page.tsx': `import { NS } from './constants';\nt(\`\${NS}.title\`);\n`,
      }),
    );
    const keys = obs.map((o) => ('resolvedKey' in o ? o.resolvedKey : undefined));
    expect(keys).toContain('app.title');
  });
});
