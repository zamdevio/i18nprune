import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const root = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.join(root, 'packages', 'cli');
const coreSrc = path.join(root, 'packages/core/src');

/** Set by `prepack` / `npm pack` so the published tarball omits source maps and bloated rolled-up `.d.ts`. */
const publish = process.env.I18NPRUNE_PUBLISH === '1';

const coreDtsEntries = {
  core: path.join(coreSrc, 'index.ts'),
  'core/config': path.join(coreSrc, 'config/index.ts'),
  'core/runtime/node': path.join(coreSrc, 'runtime/exports/node.ts'),
  'core/runtime/web': path.join(coreSrc, 'runtime/exports/web.ts'),
  'core/runtime/edge': path.join(coreSrc, 'runtime/exports/edge.ts'),
  report: path.join(coreSrc, 'shared/report/index.ts'),
} as const;

export default defineConfig({
  entry: {
    cli: 'packages/cli/bin/cli.ts',
    core: 'packages/core/src/index.ts',
    'core/config': 'packages/core/src/config/index.ts',
    'core/runtime/node': 'packages/core/src/runtime/exports/node.ts',
    'core/runtime/web': 'packages/core/src/runtime/exports/web.ts',
    'core/runtime/edge': 'packages/core/src/runtime/exports/edge.ts',
    report: 'packages/core/src/shared/report/index.ts',
  },
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  sourcemap: !publish,
  dts: {
    entry: coreDtsEntries,
    // Resolve external type references into stable declarations for npm consumers.
    resolve: true,
  },
  splitting: false,
  treeshake: true,
  external: ['jiti', 'zod', '@inquirer/prompts'],
  esbuildOptions(options) {
    options.alias = {
      '@': path.join(cliRoot, 'src'),
      // Longer paths first so `@i18nprune/core/runtime/*` does not resolve to `src/runtime/node/` (impl dir).
      '@i18nprune/core/runtime/node': path.join(coreSrc, 'runtime/exports/node.ts'),
      '@i18nprune/core/runtime/web': path.join(coreSrc, 'runtime/exports/web.ts'),
      '@i18nprune/core/runtime/edge': path.join(coreSrc, 'runtime/exports/edge.ts'),
      '@i18nprune/core/runtime/helpers/sync': path.join(coreSrc, 'runtime/exports/helpers/sync.ts'),
      '@i18nprune/core': coreSrc,
      '@i18nprune/core/report-schema': path.join(coreSrc, 'shared/report/index.ts'),
    };
  },
});
