/**
 * SDK example — programmatic use of `runGenerate` from `@i18nprune/core`.
 *
 * Demonstrates the L2 contract for the generate op:
 *
 *   1. Build `RuntimeAdapters` (no auto-default — every host passes their own).
 *   2. Load config + source locale through those adapters.
 *   3. Build `CoreContext` (config + adapters + env + paths + optional run flags).
 *   4. Implement a minimal headless `GenerateHostHooks` (no TTY, no prompts).
 *   5. (Optional) Implement `GenerateRunHooks` for mid-run decisions.
 *   6. Call `runGenerate(ctx, opts, host, hooks?)` and inspect the result.
 *
 * Run from the repo root:
 *
 *   pnpm tsx examples/sdk/generate/runGenerate.ts
 *
 * (uses the public `mymemory` provider — no API key, but a real network call).
 */

import * as nodeFs from 'node:fs';
import * as nodePath from 'node:path';
import * as nodeProcess from 'node:process';

import {
  // L3 entry
  runGenerate,
  // L2 builder
  createCoreContext,
  // Config validation (zod-backed)
  parseI18nPruneConfig,
  // Identity guard primitive (pure)
  createIdentityStreakGuard,
  // Errors / control
  IdentityAbortError,
} from '@i18nprune/core';
import type {
  GenerateHostHooks,
  GenerateRunHooks,
  GenerateRunOptions,
  I18nPruneConfig,
  RunOptions,
  RuntimeAdapters,
} from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

// ---------------------------------------------------------------------------
// 1. Adapters — explicit, no auto-default. Workers / web / edge would build
//    their own (`@i18nprune/core/runtime/web`, `/edge`).
// ---------------------------------------------------------------------------
const adapters: RuntimeAdapters = createNodeRuntimeAdapters();

// ---------------------------------------------------------------------------
// 2. Load config + source locale. `parseI18nPruneConfig` runs the same zod
//    schema the CLI uses, so a malformed config fails loudly instead of
//    crashing deep inside `runGenerate`. (For a richer pipeline see
//    `loadCoreConfigFromPath` from `@i18nprune/core`.)
// ---------------------------------------------------------------------------
const exampleDir = nodePath.dirname(new URL(import.meta.url).pathname);
const configPath = nodePath.join(exampleDir, 'i18nprune.config.json');
// `parseI18nPruneConfig` returns the zod-derived shape; cast to the friendly
// `I18nPruneConfig` view used by `createCoreContext` (same runtime data, tighter TS).
const config = parseI18nPruneConfig(
  JSON.parse(nodeFs.readFileSync(configPath, 'utf8')),
) as I18nPruneConfig;

const sourceLocalePath = nodePath.resolve(exampleDir, 'locales/en.json');
const sourceRaw: unknown = JSON.parse(nodeFs.readFileSync(sourceLocalePath, 'utf8'));

// ---------------------------------------------------------------------------
// 3. CoreContext — bundles config + adapters + env + resolved paths + (opt) run
//    flags. `paths` is the absolute layout the op uses for reads/writes.
// ---------------------------------------------------------------------------
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
    sourceLocale: sourceLocalePath,
    localesDir: nodePath.resolve(exampleDir, 'locales'),
    srcRoot: nodePath.resolve(exampleDir, 'src'),
  },
  run,
});

// ---------------------------------------------------------------------------
// 4. Host hooks — headless flavor. No TTY. No prompts. All log channels write
//    to stderr; printers are no-ops because this is a programmatic call (the
//    SDK consumer formats output themselves from the returned `payload`).
//
//    Compare this surface to the CLI's flavor in
//    `packages/cli/src/commands/generate/run.ts` to see the trade-offs.
// ---------------------------------------------------------------------------
const host: GenerateHostHooks = {
  emitProgress: () => {},

  createSession: () => ({
    progress: { tick: () => {} },
    finish: () => {},
    fail: () => {},
  }),

  createIdentityStreakGuard: (target) =>
    createIdentityStreakGuard({
      command: 'generate',
      target,
      // Headless: emit warn-issues, never abort the run on identity streaks.
      interactive: () => false,
    }),

  buildTickProgressRelay:
    () =>
    (_current: number, _total: number, _label: string) => {},

  log: {
    info: (msg) => nodeProcess.stderr.write(`[info]   ${msg}\n`),
    notice: (msg) => nodeProcess.stderr.write(`[notice] ${msg}\n`),
    warn: (msg) => nodeProcess.stderr.write(`[warn]   ${msg}\n`),
  },

  // Headless: never ask the user; always accept defaults.
  shouldSkipInteractivePrompts: () => true,
  canAskInteractive: () => false,

  promptMetaLocaleDetails: async (defaults) => defaults,
  promptFullRetranslate: async () => false,

  printSessionBanner: () => {},
  printPreserveParityReport: () => {},
  printFinalizeSummary: () => {},

  onIdentityAbortNotice: (err: IdentityAbortError, opts) => {
    nodeProcess.stderr.write(
      `[identity-abort] ${err.message} (dryRun=${String(opts.dryRun)})\n`,
    );
  },
};

// ---------------------------------------------------------------------------
// 5. (Optional) Run hooks for mid-run decisions. Both fields are optional;
//    omitting them keeps today's defaults (linear provider chain, throw on
//    chain exhaustion). Wire them when you want to override that policy.
// ---------------------------------------------------------------------------
const hooks: GenerateRunHooks = {
  // When the chain can't finish (all retryable failures, or non-retryable
  // mid-run with leaves stranded), decide what to do. This headless host
  // chooses to abort — same as today's default — but a CI host might want
  // `write_partial` so the rest of the pipeline gets the partial output.
  onIncomplete: async (info) => {
    nodeProcess.stderr.write(
      `[onIncomplete] target=${info.target} reason=${info.reason} ` +
        `successful=${String(info.successfulLeaves)} failed=${String(info.failedLeaves)} ` +
        `lastError=${info.lastError?.code ?? 'n/a'}\n`,
    );
    return { action: 'abort_no_write' };
  },
  // Between providers: pin the next provider id, or return null for the
  // natural chain order. Headless host: always natural order.
  onHandoffPick: async (offer) => {
    nodeProcess.stderr.write(
      `[onHandoffPick] target=${offer.target} ` +
        `failed=${offer.failedProviderId} (${offer.failureReason}) ` +
        `remaining=[${offer.remainingProviderIds.join(', ')}]\n`,
    );
    return null;
  },
};

// ---------------------------------------------------------------------------
// 6. Call runGenerate. The `targets` list is host-resolved (--target on CLI,
//    your own UX in an SDK consumer). `preloadedRaw` skips a redundant source
//    re-read since we already read it above for the example walkthrough.
// ---------------------------------------------------------------------------
const opts: GenerateRunOptions = {
  targets: ['fr', 'es'],
  dynamicKeySites: 0,
  preloadedRaw: sourceRaw,
  // Set `dryRun: true` if you want to walk the pipeline without writing files.
  dryRun: true,
};

async function main(): Promise<void> {
  try {
    const { payload, issues } = await runGenerate(ctx, opts, host, hooks);

    nodeProcess.stdout.write(`\nrunGenerate returned ${String(payload.targetResults.length)} target row(s):\n`);
    for (const row of payload.targetResults) {
      nodeProcess.stdout.write(
        `  - ${row.target}: status=${row.status} winner=${row.winnerProviderId ?? 'n/a'} ` +
          `markedForReview=${String(row.markedForReview ?? 0)}\n`,
      );
    }
    if (issues.length > 0) {
      nodeProcess.stdout.write(`\nissues:\n`);
      for (const issue of issues) {
        nodeProcess.stdout.write(`  [${issue.severity}] ${issue.code}: ${issue.message}\n`);
      }
    }
  } catch (err) {
    // Most failures are signaled through `issues` on the payload; a thrown error
    // means the run hit something the host couldn't decide on (USAGE, missing
    // credentials, identity abort with no `onIdentityAbortNotice` recovery).
    nodeProcess.stderr.write(
      `\nrunGenerate threw: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exitCode = 1;
  }
}

void main();
