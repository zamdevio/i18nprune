import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: {
    cli: 'bin/cli.ts',
    config: 'src/exports/config.ts',
    core: 'src/exports/core.ts',
  },
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: {
    entry: ['src/exports/config.ts', 'src/exports/core.ts'],
    resolve: true,
  },
  splitting: false,
  treeshake: true,
  external: ['jiti', 'zod', '@inquirer/prompts'],
  esbuildOptions(options) {
    options.alias = {
      '@': path.join(root, 'src'),
    };
  },
});
