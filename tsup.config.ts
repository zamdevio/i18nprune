import { readFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'tsup';
import { coreSrc, esbuildAliasMap, root } from './scripts/dev/pathAliases.mjs';

function readPackageVersion(packageJsonPath: string): string {
  const version = (JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: string }).version;
  if (!version) {
    throw new Error(`Missing "version" in ${packageJsonPath}`);
  }
  return version;
}

const rootPackageVersion = readPackageVersion(path.join(root, 'package.json'));
const corePackageVersion = readPackageVersion(path.join(root, 'packages/core/package.json'));

/** Set by `prepack` / `npm pack` so the published tarball omits source maps and bloated rolled-up `.d.ts`. */
const publish = process.env.I18NPRUNE_PUBLISH === '1';

const coreDtsEntries = {
  core: path.join(coreSrc, 'index.ts'),
  'core/config': path.join(coreSrc, 'config/index.ts'),
  'core/runtime/node': path.join(coreSrc, 'runtime/exports/node.ts'),
  'core/runtime/web': path.join(coreSrc, 'runtime/exports/web.ts'),
  'core/runtime/edge': path.join(coreSrc, 'runtime/exports/edge.ts'),
  report: path.join(coreSrc, 'shared/report/index.ts'),
};

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
  platform: 'node',
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
  /**
   * Bundled CJS deps (commander) call `require("events")`. ESM output has no bare `require`,
   * so inject `createRequire` once at the top of each chunk. Node CLI / `dist/cli.js` only —
   * not intended for browser bundles. Prefer keeping this over externalizing commander unless
   * we move the CLI to a pure-ESM commander path. Do not remove without a replacement that
   * still runs `node dist/cli.js` with zero Node builtin polyfills from the host.
   */
  banner: {
    js: "import { createRequire as __i18npruneCreateRequire } from 'module'; const require = __i18npruneCreateRequire(import.meta.url);",
  },
  esbuildOptions(options) {
    options.define = {
      ...options.define,
      __I18NPRUNE_CLI_VERSION__: JSON.stringify(rootPackageVersion),
      __I18NPRUNE_SDK_VERSION__: JSON.stringify(corePackageVersion),
    };
    options.alias = esbuildAliasMap();
  },
});
