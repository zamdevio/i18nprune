/**
 * SDK example — programmatic use of `runSync` from `@i18nprune/core`.
 *
 * Demonstrates the L2 contract for the sync op:
 *
 *   1. Build `RuntimeAdapters` (no auto-default — every host passes their own).
 *   2. Author config with `defineConfig` in `i18nprune.config.ts` and import it.
 *   3. Build `CoreContext` (config + adapters + env + paths + optional run flags).
 *   4. Implement a minimal headless `SyncHostHooks`.
 *   5. Call `runSync(ctx, opts, host)` with `dryRun: true` and inspect the result.
 *
 * Run from the repo root:
 *
 *   pnpm tsx examples/sdk/sync/runSync.ts
 */

import * as nodePath from 'node:path';
import * as nodeProcess from 'node:process';

import { createCoreContext, runSync } from '@i18nprune/core';
import type { RunOptions, RuntimeAdapters, SyncHostHooks } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

import config from './i18nprune.config.js';

// 1. Adapters — explicit, no auto-default. Workers / web / edge would build
// their own and pass the matching adapter bundle here.
const adapters: RuntimeAdapters = createNodeRuntimeAdapters();

// 2. Config — authored once with `defineConfig`, then passed directly into
// `createCoreContext`.
const exampleDir = nodePath.dirname(new URL(import.meta.url).pathname);

// 3. CoreContext — sync needs project paths plus adapters. `env` is still
// explicit for consistency across project ops even though sync does not read it.
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

// 4. Host hooks — headless flavor. The CLI implementation loads cached report
// details; this standalone example has no source scan, so it supplies an empty
// reference set and logs progress to stderr.
const host: SyncHostHooks = {
  emitProgress: (event) => {
    nodeProcess.stderr.write(`[sync progress] ${event.phase}${event.label ? ` · ${event.label}` : ''}\n`);
  },
  loadReferenceData: () => ({
    keyObservations: [],
    dynamicSites: [],
  }),
};

// 5. Run sync in dry-run mode so the example is non-destructive. `metadata: true`
// shows the structured leaf repair path in `localeMetadataReports`.
const out = runSync(ctx, { target: 'fr', dryRun: true, metadata: true }, host);

nodeProcess.stdout.write(
  `${JSON.stringify(
    {
      payload: out.payload,
      issues: out.issues,
      humanLeafSummaryByLocaleFile: out.humanLeafSummaryByLocaleFile,
    },
    null,
    2,
  )}\n`,
);
