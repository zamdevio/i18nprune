/**
 * SDK example — programmatic use of `runDoctor` from `@i18nprune/core`.
 *
 * Demonstrates the L2 contract for the doctor op:
 *
 *   1. Build `RuntimeAdapters` (no auto-default — every host passes their own).
 *   2. Author config with `defineConfig` in `i18nprune.config.ts` and import it.
 *   3. Build `CoreContext` (config + adapters + env + paths + optional run flags).
 *   4. Implement `DoctorHostHooks` — supply environment facts the core cannot
 *      discover on its own (Node version, ripgrep availability, config presence).
 *   5. Call `runDoctor(ctx, opts, host)` and inspect the result.
 *
 * Run from the repo root:
 *
 *   pnpm tsx examples/sdk/doctor/runDoctor.ts
 */

import * as nodePath from 'node:path';
import * as nodeProcess from 'node:process';
import { execFileSync } from 'node:child_process';
import * as nodeFs from 'node:fs';

import { createCoreContext, runDoctor } from '@i18nprune/core';
import type { DoctorHostHooks, RunOptions, RuntimeAdapters } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

import config from './i18nprune.config.js';

// 1. Adapters — explicit, no auto-default.
const adapters: RuntimeAdapters = createNodeRuntimeAdapters();

// 2. Paths — resolved relative to this example directory.
const exampleDir = nodePath.dirname(new URL(import.meta.url).pathname);

// 3. CoreContext — doctor uses paths to verify source/localesDir/srcRoot exist.
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

// 4. Host hooks — supply the environment facts core needs.
function isRgAvailable(): boolean {
  try {
    execFileSync('rg', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const host: DoctorHostHooks = {
  nodeVersion: nodeProcess.version,
  rgAvailable: isRgAvailable(),
  hasConfigFile: nodeFs.existsSync(nodePath.resolve(exampleDir, 'i18nprune.config.ts')),
  configPathLabel: 'i18nprune.config.ts',
};

// 5. Run doctor — inspect findings and exit code.
const result = runDoctor(ctx, { strict: false }, host);

nodeProcess.stdout.write(
  `${JSON.stringify(
    {
      payload: result.payload,
      issues: result.issues,
      exitCode: result.exitCode,
    },
    null,
    2,
  )}\n`,
);

if (result.exitCode !== 0) nodeProcess.exit(result.exitCode);
