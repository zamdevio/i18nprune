/**
 * Sample config consumed by the `runMissing` SDK example.
 */
import { defineConfig } from '@i18nprune/core';

export default defineConfig({
  locales: {
    source: 'examples/sdk/missing/locales/en.json',
    directory: 'examples/sdk/missing/locales',
  },
  src: 'examples/sdk/missing/src',
  functions: ['t'],
});
