import { defineConfig } from 'tsup';

/** Set by `prepack` so the published SDK tarball omits source maps. */
const publish = process.env.I18NPRUNE_PUBLISH === '1';

/** Subpath JS + per-file `.d.ts` (second pass in `tsup.subpaths-dts.config.ts`). */
export const subpathEntries = {
  shared: 'src/shared/index.ts',
  types: 'src/types/index.ts',
  'types/shared': 'src/types/shared/index.ts',
  locales: 'src/namespaces/locales.ts',
  generate: 'src/generate/index.ts',
  init: 'src/init/index.ts',
  config: 'src/config/index.ts',
  'report-schema': 'src/shared/report/index.ts',
  sync: 'src/sync/index.ts',
  validate: 'src/validate/index.ts',
  missing: 'src/missing/index.ts',
  cleanup: 'src/cleanup/index.ts',
  quality: 'src/quality/index.ts',
  'runtime/node': 'src/runtime/exports/node.ts',
  'runtime/web': 'src/runtime/exports/web.ts',
  'runtime/edge': 'src/runtime/exports/edge.ts',
  'runtime/helpers/sync': 'src/runtime/exports/helpers/sync.ts',
} as const;

const allEntries = {
  index: 'src/index.ts',
  ...subpathEntries,
};

export default defineConfig({
  entry: allEntries,
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: !publish,
  /**
   * Roll `index.d.ts` only. Subpath keys that match `export * as <name>` on the root barrel
   * (e.g. `validate`, `sync`) must not appear here — tsup leaves those namespaces empty.
   */
  dts: {
    entry: { index: 'src/index.ts' },
    resolve: true,
  },
  splitting: false,
  treeshake: true,
  external: ['zod', 'fflate'],
});
