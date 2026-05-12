/**
 * SDK example — programmatic use of `runTranslate` from `@i18nprune/core`.
 *
 * Demonstrates the translate-only L2 contract:
 *
 *   1. Build `RuntimeAdapters` (no auto-default — every host passes their own).
 *   2. Author a translate-block config (no project paths or locale files).
 *   3. Build `TranslateContext` (config + adapters + env).
 *   4. Implement optional observation hooks.
 *   5. Call `runTranslate(ctx, opts)` and inspect the ordered output.
 *
 * Run from the repo root:
 *
 *   pnpm tsx examples/sdk/translate/runTranslate.ts
 *
 * Uses the public `google` web-translate backend — no API key, but a real network call.
 */

import * as nodeProcess from 'node:process';

import { createTranslateContext, runTranslate } from '@i18nprune/core';
import type {
  RuntimeAdapters,
  TranslateConfigInput,
  TranslateHooks,
  TranslateOptions,
} from '@i18nprune/core';
import { createNodeRuntimeAdapters } from '@i18nprune/core/runtime/node';

// ---------------------------------------------------------------------------
// 1. Adapters — explicit, no auto-default. Workers / web / edge would build
//    their own (`@i18nprune/core/runtime/web`, `/edge`).
// ---------------------------------------------------------------------------
const adapters: RuntimeAdapters = createNodeRuntimeAdapters();

// ---------------------------------------------------------------------------
// 2. Translate config — this is only the `translate` block, not a full
//    `I18nPruneConfig`. `runTranslate` has no project layout and performs no
//    locale-file IO.
// ---------------------------------------------------------------------------
const translateConfig: TranslateConfigInput = {
  primary: 'google',
  providers: [
    {
      id: 'google',
      rateLimit: {
        maxConcurrency: 1,
      },
    },
  ],
  workers: 1,
  policy: {
    routing: 'single',
    onRateLimit: 'backoff',
    onTransientFailure: 'retry',
  },
};

// ---------------------------------------------------------------------------
// 3. TranslateContext — bundles config + adapters + env. Core never reads
//    `process.env` itself; the host decides what env map to expose.
// ---------------------------------------------------------------------------
const ctx = createTranslateContext({
  config: translateConfig,
  adapters,
  env: nodeProcess.env,
});

// ---------------------------------------------------------------------------
// 4. Hooks — optional observation only. There is no required host surface for
//    the primitive because it does not print, prompt, or write files.
// ---------------------------------------------------------------------------
const hooks: TranslateHooks = {
  onTick: (current, total, label) => {
    nodeProcess.stderr.write(`[translate progress] ${String(current)}/${String(total)} · ${label}\n`);
  },
  onProviderAttempt: (attempt) => {
    nodeProcess.stderr.write(
      `[provider attempt] ${attempt.providerId} -> ${attempt.outcome} ` +
        `(${String(attempt.durationMs ?? 0)}ms)\n`,
    );
  },
  onTranslatedLeaf: (sourceText, translatedText, key) => {
    nodeProcess.stderr.write(`[leaf] ${String(key)}: "${sourceText}" -> "${translatedText}"\n`);
  },
};

// ---------------------------------------------------------------------------
// 5. Call runTranslate. `leaves` preserves a stable key per item; `texts` is
//    also supported when the caller only needs ordered strings.
// ---------------------------------------------------------------------------
const opts: TranslateOptions = {
  leaves: [
    { key: 'app.title', source: 'Welcome to the example' },
    { key: 'actions.save', source: 'Save' },
    { key: 'empty.copy', source: '   ' },
  ],
  sourceLang: 'en',
  targetLang: 'fr',
  hooks,
  identityGuard: {
    enabled: true,
  },
};

async function main(): Promise<void> {
  try {
    const out = await runTranslate(ctx, opts);

    nodeProcess.stdout.write(`\nrunTranslate returned ${String(out.translations.length)} item(s):\n`);
    for (const item of out.translations) {
      if (item.ok) {
        nodeProcess.stdout.write(`  - ${item.key ?? '<index>'}: ${item.value} (${item.providerId})\n`);
      } else {
        nodeProcess.stdout.write(`  - ${item.key ?? '<index>'}: ${item.reason} (${item.sourceValue})\n`);
      }
    }

    nodeProcess.stdout.write(
      `\nwinner=${out.winnerProviderId ?? 'n/a'} fallbackCount=${String(out.fallbackCount)} ` +
        `attempts=${String(out.providerAttempts.length)}\n`,
    );

    const notices = [...out.warnings, ...out.issues];
    if (notices.length > 0) {
      nodeProcess.stdout.write(`\nnotices:\n`);
      for (const issue of notices) {
        nodeProcess.stdout.write(`  [${issue.severity}] ${issue.code}: ${issue.message}\n`);
      }
    }
  } catch (err) {
    nodeProcess.stderr.write(`\nrunTranslate threw: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  }
}

void main();
