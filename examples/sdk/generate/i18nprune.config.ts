/**
 * Sample `i18nprune.config.ts` consumed by the `runGenerate` SDK example.
 *
 * The supported config formats are `.ts`, `.mts`, `.cts`, `.js`, `.mjs`, and `.cjs` — JSON
 * configs are intentionally not loaded (`SUPPORTED_CONFIG_EXTENSIONS` in
 * `packages/cli/src/shared/config/paths.ts`).
 *
 * `defineConfig` returns the public `I18nPruneConfig` type directly so it can be passed to
 * `createCoreContext` without an extra cast.
 */
import { defineConfig } from '@i18nprune/core';

export default defineConfig({
  locales: {
    source: 'examples/sdk/generate/locales/en.json',
    directory: 'examples/sdk/generate/locales',
  },
  src: 'examples/sdk/generate/src',
  functions: ['t'],
  translate: {
    primary: 'google',
    providers: [{ id: 'google' }],
    policy: {
      routing: 'single',
      onRateLimit: 'backoff',
      onTransientFailure: 'retry',
    },
  },
});
