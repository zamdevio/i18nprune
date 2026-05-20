/**
 * SDK example — `runShareList` + core human messages from `@i18nprune/core`.
 *
 * Run from repo root:
 *
 *   pnpm tsx examples/sdk/share/runShareList.ts
 */

import * as nodePath from 'node:path';
import * as nodeProcess from 'node:process';

import {
  createCoreContext,
  emitShareListHumanMessages,
  resolveShareWorkerBaseUrl,
  runShareList,
} from '@i18nprune/core';
import type { RunOptions, RuntimeAdapters } from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

import config from './i18nprune.config.js';

const adapters: RuntimeAdapters = createNodeRuntimeAdapters();
const exampleDir = nodePath.dirname(new URL(import.meta.url).pathname);

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

const listed = runShareList({ ctx });
const workerBase = resolveShareWorkerBaseUrl(
  nodeProcess.env.I18NPRUNE_WORKER_URL?.trim() || undefined,
);

nodeProcess.stdout.write(
  `${JSON.stringify({ workerBase, entryCount: listed.entries.length, issues: listed.issues }, null, 2)}\n`,
);

emitShareListHumanMessages(
  {
    emit: (event) => {
      if (event.type === 'run.message') nodeProcess.stdout.write(`[share] ${event.message}\n`);
    },
  },
  listed.entries,
);
