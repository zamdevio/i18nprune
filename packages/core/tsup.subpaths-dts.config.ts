import { defineConfig } from 'tsup';
import { subpathEntries } from './tsup.config.ts';

/** Emit subpath `.d.ts` files without re-rolling `index.d.ts` (see `tsup.config.ts`). */
export default defineConfig({
  entry: { ...subpathEntries },
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: false,
  sourcemap: false,
  dts: {
    resolve: true,
  },
  splitting: false,
  treeshake: true,
  external: ['zod', 'fflate'],
});
