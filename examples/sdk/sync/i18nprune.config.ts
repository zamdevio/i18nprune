/**
 * Sample config consumed by the `runSync` SDK example.
 *
 * `defineConfig` returns the public `I18nPruneConfig` type directly so it can be passed to
 * `createCoreContext` without an extra cast.
 */
import { defineConfig } from '@i18nprune/core';

export default defineConfig({
  locales: {
    source: 'examples/sdk/sync/locales/en.json',
    directory: 'examples/sdk/sync/locales',
  },
  src: 'examples/sdk/sync/src',
  functions: ['t'],
});
