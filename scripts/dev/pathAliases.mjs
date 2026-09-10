/**
 * Shared path aliases for Vitest + root tsup (CLI/core bundle).
 *
 * TypeScript `tsconfig.json` `paths` stays the full IDE/typecheck map (seo, ui, op
 * subpaths, …). This module owns the **runtime** subset that tests and the CLI
 * bundle must resolve the same way — update here when adding an alias used by
 * either, and mirror into `tsconfig.json` if types need it too.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cliSrc = path.join(root, 'packages/cli/src');
const coreSrc = path.join(root, 'packages/core/src');

export { root, cliSrc, coreSrc };

/** Exact string → absolute path. Longer `@i18nprune/core/runtime/*` keys before `@i18nprune/core`. */
export function esbuildAliasMap() {
  return {
    '@': cliSrc,
    '@i18nprune/core/runtime/node': path.join(coreSrc, 'runtime/exports/node.ts'),
    '@i18nprune/core/runtime/web': path.join(coreSrc, 'runtime/exports/web.ts'),
    '@i18nprune/core/runtime/edge': path.join(coreSrc, 'runtime/exports/edge.ts'),
    '@i18nprune/core/runtime/helpers/sync': path.join(coreSrc, 'runtime/exports/helpers/sync.ts'),
    '@i18nprune/core/report-schema': path.join(coreSrc, 'shared/report/index.ts'),
    '@i18nprune/core': coreSrc,
  };
}

/**
 * Vitest `resolve.alias` entries. Specific finds first; regex subpath before bare core.
 * Bare `@i18nprune/core` points at `index.ts` (Vitest file resolve); esbuild uses the dir.
 */
export function vitestAliasEntries() {
  return [
    { find: '@', replacement: cliSrc },
    {
      find: '@i18nprune/core/runtime/node',
      replacement: path.join(coreSrc, 'runtime/exports/node.ts'),
    },
    {
      find: '@i18nprune/core/runtime/web',
      replacement: path.join(coreSrc, 'runtime/exports/web.ts'),
    },
    {
      find: '@i18nprune/core/runtime/edge',
      replacement: path.join(coreSrc, 'runtime/exports/edge.ts'),
    },
    {
      find: '@i18nprune/core/runtime/helpers/sync',
      replacement: path.join(coreSrc, 'runtime/exports/helpers/sync.ts'),
    },
    {
      find: '@i18nprune/core/report-schema',
      replacement: path.join(coreSrc, 'shared/report/index.ts'),
    },
    {
      find: /^@i18nprune\/core\/(.+)$/,
      replacement: path.join(coreSrc, '$1'),
    },
    {
      find: '@i18nprune/core',
      replacement: path.join(coreSrc, 'index.ts'),
    },
  ];
}
