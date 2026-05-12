/**
 * SDK example — programmatic use of `runReview` from `@i18nprune/core`.
 *
 * Demonstrates the L2 contract for the review op:
 *
 *   1. Build `RuntimeAdapters` (no auto-default — every host passes their own).
 *   2. Author config with `defineConfig` in `i18nprune.config.ts` and import it.
 *   3. Build `CoreContext` (config + adapters + env + paths + optional run flags).
 *   4. Implement `ReviewHostHooks` for dynamic-site counts.
 *   5. Call `runReview(ctx, opts, host)` and inspect the result.
 *
 * Run from the repo root:
 *
 *   pnpm tsx examples/sdk/review/runReview.ts
 */

import * as nodePath from 'node:path';
import * as nodeProcess from 'node:process';

import { createCoreContext, runReview } from '@i18nprune/core';
import type { ReviewHostHooks, RunOptions, RuntimeAdapters } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

import config from './i18nprune.config.js';

// 1. Adapters — explicit, no auto-default.
const adapters: RuntimeAdapters = createNodeRuntimeAdapters();

// 2. Config — authored with `defineConfig` and passed directly into context.
const exampleDir = nodePath.dirname(new URL(import.meta.url).pathname);

// 3. CoreContext — review reads source/target locale JSON via adapters.
const run: RunOptions = {
  json: false,
  jsonPretty: false,
  quiet: false,
  silent: false,
  debugScan: false,
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

// 4. Host hooks — the CLI derives this from cached report data. This standalone
// example has no dynamic translation call sites.
const host: ReviewHostHooks = {
  getDynamicSitesCount: () => 0,
};

// 5. Run review. `target` is optional; omit it to inspect all non-source locale files.
const out = runReview(ctx, { target: 'fr' }, host);

nodeProcess.stdout.write(
  `${JSON.stringify(
    {
      payload: out.payload,
      issues: out.issues,
    },
    null,
    2,
  )}\n`,
);
