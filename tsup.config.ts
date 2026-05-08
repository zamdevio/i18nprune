import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const root = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.join(root, 'packages', 'cli');

export default defineConfig({
  entry: {
    cli: 'packages/cli/bin/cli.ts',
    core: 'packages/core/src/index.ts',
    'core/config': 'packages/core/src/config/index.ts',
    'core/runtime/node': 'packages/core/src/runtime/exports/node.ts',
    'core/runtime/web': 'packages/core/src/runtime/exports/web.ts',
    'core/runtime/edge': 'packages/core/src/runtime/exports/edge.ts',
    report: 'packages/report/src/index.ts',
  },
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  dts: {
    entry: [
      'packages/core/src/index.ts',
      'packages/core/src/config/index.ts',
      'packages/core/src/runtime/exports/node.ts',
      'packages/core/src/runtime/exports/web.ts',
      'packages/core/src/runtime/exports/edge.ts',
      'packages/report/src/index.ts',
    ],
    resolve: true,
  },
  splitting: false,
  treeshake: true,
  external: ['jiti', 'zod', '@inquirer/prompts'],
  esbuildOptions(options) {
    const coreSrc = path.join(root, 'packages/core/src');
    options.alias = {
      '@': path.join(cliRoot, 'src'),
      // Longer paths first so `@i18nprune/core/runtime/*` does not resolve to `src/runtime/node/` (impl dir).
      '@i18nprune/core/runtime/node': path.join(coreSrc, 'runtime/exports/node.ts'),
      '@i18nprune/core/runtime/web': path.join(coreSrc, 'runtime/exports/web.ts'),
      '@i18nprune/core/runtime/edge': path.join(coreSrc, 'runtime/exports/edge.ts'),
      '@i18nprune/core/runtime/helpers/sync': path.join(coreSrc, 'runtime/exports/helpers/sync.ts'),
      '@i18nprune/core': coreSrc,
      '@i18nprune/report': path.join(root, 'packages/report/src'),
    };
  },
});
