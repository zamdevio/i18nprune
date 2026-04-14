import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const root = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.join(root, 'packages', 'cli');

export default defineConfig({
  entry: {
    cli: 'packages/cli/bin/cli.ts',
    config: 'packages/cli/src/exports/config.ts',
    core: 'packages/cli/src/exports/core.ts',
    report: 'packages/report/src/index.ts',
  },
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: {
    entry: [
      'packages/cli/src/exports/config.ts',
      'packages/cli/src/exports/core.ts',
      'packages/report/src/index.ts',
    ],
    resolve: true,
  },
  splitting: false,
  treeshake: true,
  external: ['jiti', 'zod', '@inquirer/prompts'],
  esbuildOptions(options) {
    options.alias = {
      '@': path.join(cliRoot, 'src'),
      '@zamdevio/i18nprune/report': path.join(root, 'packages/report/src/index.ts'),
    };
  },
});
