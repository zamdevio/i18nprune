import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createNodeRuntimeAdapters } from '../../../runtime/exports/node.js';
import type { RuntimePathPort } from '../../../types/runtime/path.js';
import { scanProjectDynamicKeySites } from '../../dynamic/orchestrate.js';
import { scanProjectKeyObservations } from '../../keySites/orchestrate.js';
import {
  buildProjectExportConstIndex,
  importedConstsForFile,
  resolveModulePath,
} from '../index.js';

const rt = createNodeRuntimeAdapters();
/** Host-normalized fixture path (Windows → `\repo\…`, POSIX → `/repo/…`). */
const n = (p: string) => rt.path.normalize(p);

/** Path port that throws if `resolve` is used — cross-file lookup must stay join-based. */
function joinOnlyPathPort(): RuntimePathPort {
  const { posix } = path;
  return {
    join: (...parts) => posix.join(...parts),
    dirname: (value) => posix.dirname(value),
    basename: (value, ext) => posix.basename(value, ext),
    normalize: (value) => posix.normalize(value),
    relative: (from, to) => posix.relative(from, to),
    resolve: () => {
      throw new Error('resolve must not be used for cross-file module lookup');
    },
    isAbsolute: (value) => posix.isAbsolute(value),
  };
}

function projectInput(files: Record<string, string>) {
  return {
    srcRoot: n('/repo/src'),
    cwd: n('/repo'),
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
          filePath: n('/repo/src/constants.ts'),
          text: `export const NS = 'app';\nexport const ROUTES = 'seo.routes';\nexport const T = \`\${NS}.x\`;\n`,
        },
      ],
      rt.path,
    );
    expect(index.get(n('/repo/src/constants.ts'))).toEqual({ NS: 'app', ROUTES: 'seo.routes' });
  });

  it('follows re-exports (barrel) up to two hops', () => {
    const index = buildProjectExportConstIndex(
      [
        { filePath: n('/repo/src/constants.ts'), text: `export const NS = 'app';\n` },
        { filePath: n('/repo/src/barrel.ts'), text: `export { NS } from './constants';\n` },
        { filePath: n('/repo/src/root.ts'), text: `export { NS } from './barrel';\n` },
      ],
      rt.path,
    );
    expect(index.get(n('/repo/src/barrel.ts'))).toEqual({ NS: 'app' });
    expect(index.get(n('/repo/src/root.ts'))).toEqual({ NS: 'app' });
  });

  it('resolves extension-less specifiers and index files', () => {
    const index = buildProjectExportConstIndex(
      [
        { filePath: n('/repo/src/constants.ts'), text: `export const A = 'a';\n` },
        { filePath: n('/repo/src/dir/index.ts'), text: `export const B = 'b';\n` },
      ],
      rt.path,
    );
    expect(resolveModulePath(n('/repo/src/page.tsx'), './constants', index, rt.path)).toBe(
      n('/repo/src/constants.ts'),
    );
    expect(resolveModulePath(n('/repo/src/page.tsx'), './dir', index, rt.path)).toBe(
      n('/repo/src/dir/index.ts'),
    );
    expect(resolveModulePath(n('/repo/src/page.tsx'), 'react', index, rt.path)).toBeNull();
  });

  it('resolves via join+normalize (no path.resolve / drive injection)', () => {
    const pathPort = joinOnlyPathPort();
    const index = buildProjectExportConstIndex(
      [{ filePath: '/repo/src/constants.ts', text: `export const A = 'a';\n` }],
      pathPort,
    );
    expect(resolveModulePath('/repo/src/page.tsx', './constants', index, pathPort)).toBe(
      '/repo/src/constants.ts',
    );
  });
});

describe('importedConstsForFile', () => {
  const index = buildProjectExportConstIndex(
    [{ filePath: n('/repo/src/constants.ts'), text: `export const NS = 'app';\n` }],
    rt.path,
  );

  it('maps a named import to its exported value', () => {
    expect(
      importedConstsForFile(
        `import { NS } from './constants';\nt(\`\${NS}.x\`);`,
        n('/repo/src/page.tsx'),
        index,
        rt.path,
      ),
    ).toEqual({ NS: 'app' });
  });

  it('maps an aliased import to the local name', () => {
    expect(
      importedConstsForFile(
        `import { NS as NS2 } from './constants';`,
        n('/repo/src/page.tsx'),
        index,
        rt.path,
      ),
    ).toEqual({ NS2: 'app' });
  });

  it('ignores type-only imports and unknown exports', () => {
    expect(
      importedConstsForFile(
        `import type { NS } from './constants';\nimport { NOPE } from './constants';`,
        n('/repo/src/page.tsx'),
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
        [n('/repo/src/constants.ts')]: `export const NS = 'app';\n`,
        [n('/repo/src/page.tsx')]: `import { NS } from './constants';\nt(\`\${NS}.title\`);\n`,
      }),
    );
    // Fully resolved → no dynamic site remains.
    expect(sites).toEqual([]);
  });

  it('keeps an unknown import dynamic', () => {
    const sites = scanProjectDynamicKeySites(
      projectInput({
        [n('/repo/src/constants.ts')]: `export const NS = 'app';\n`,
        [n('/repo/src/page.tsx')]: `import { NOPE } from './constants';\nt(\`\${NOPE}.title\`);\n`,
      }),
    );
    expect(sites.some((s) => s.kind === 'template_interpolation')).toBe(true);
  });

  it('keeps colliding names independent per file (no global merge)', () => {
    const sites = scanProjectDynamicKeySites(
      projectInput({
        [n('/repo/src/a/constants.ts')]: `export const NS = 'appA';\n`,
        [n('/repo/src/b/constants.ts')]: `export const NS = 'appB';\n`,
        [n('/repo/src/a/page.tsx')]: `import { NS } from './constants';\nt(\`\${NS}.x\`);\n`,
        [n('/repo/src/b/page.tsx')]: `import { NS } from './constants';\nt(\`\${NS}.x\`);\n`,
      }),
    );
    // Both resolve to their own module's NS → no dynamic sites either side.
    expect(sites).toEqual([]);
  });

  it('folds through a barrel re-export', () => {
    const sites = scanProjectDynamicKeySites(
      projectInput({
        [n('/repo/src/constants.ts')]: `export const NS = 'app';\n`,
        [n('/repo/src/barrel.ts')]: `export { NS } from './constants';\n`,
        [n('/repo/src/page.tsx')]: `import { NS } from './barrel';\nt(\`\${NS}.y\`);\n`,
      }),
    );
    expect(sites).toEqual([]);
  });

  it('records the imported const as a resolved key observation', () => {
    const obs = scanProjectKeyObservations(
      projectInput({
        [n('/repo/src/constants.ts')]: `export const NS = 'app';\n`,
        [n('/repo/src/page.tsx')]: `import { NS } from './constants';\nt(\`\${NS}.title\`);\n`,
      }),
    );
    const keys = obs.map((o) => ('resolvedKey' in o ? o.resolvedKey : undefined));
    expect(keys).toContain('app.title');
  });
});
