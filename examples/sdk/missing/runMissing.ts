/**
 * SDK example — programmatic use of `runMissing` from `@i18nprune/core`.
 *
 * Demonstrates the L2 contract for the missing op:
 *
 *   1. Build `RuntimeAdapters` (no auto-default — every host passes their own).
 *   2. Author config with `defineConfig` in `i18nprune.config.ts` and import it.
 *   3. Build `CoreContext` (config + adapters + env + paths + optional run flags).
 *   4. Implement optional `MissingHostHooks` for host messages.
 *   5. Call `runMissing(ctx, opts, host)` with `dryRun: true` and inspect the result.
 *
 * Run from the repo root:
 *
 *   pnpm tsx examples/sdk/missing/runMissing.ts
 */

import * as nodePath from 'node:path';
import * as nodeProcess from 'node:process';

import { createCoreContext, runMissing } from '@i18nprune/core';
import type { MissingHostHooks, RunOptions, RuntimeAdapters } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

import config from './i18nprune.config.js';

// 1. Adapters — explicit, no auto-default.
const adapters: RuntimeAdapters = createNodeRuntimeAdapters();

// 2. Config — authored with `defineConfig` and passed directly into context.
const exampleDir = nodePath.dirname(new URL(import.meta.url).pathname);

// 3. CoreContext — missing reads the configured target locale via adapters.
const run: RunOptions = {
  json: false,
  jsonPretty: false,
  quiet: false,
  silent: false,
  debugScan: false,
  debugCache: false,
};

const ctx = createCoreContext({
  config,
  adapters,
  env: nodeProcess.env,
  paths: {
    sourceLocale: nodePath.resolve(exampleDir, 'locales/en.json'),
    localesDir: nodePath.resolve(exampleDir, 'locales'),
    srcRoot: nodePath.resolve(exampleDir, 'src'),
  },
  run,
});

// 4. Host hooks — analysis is core-owned; hosts only provide message plumbing when needed.
const host: MissingHostHooks = {};

// 5. Run in dry-run mode. `runMissing` plans the paths; hosts decide when to
// call `writeMissingPaths` after user confirmation.
const out = runMissing(ctx, { dryRun: true }, host);

nodeProcess.stdout.write(
  `${JSON.stringify(
    {
      payload: out.payload,
      issues: out.issues,
      targets: out.targets.map((entry) => ({
        targetPath: entry.target.targetPath,
        targetKind: entry.target.targetKind,
        pathsAdded: entry.toAdd.length,
      })),
    },
    null,
    2,
  )}\n`,
);
