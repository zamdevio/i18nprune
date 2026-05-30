/**
 * Sample config consumed by the `runQuality` SDK example.
 */
import { defineConfig } from '@i18nprune/core';

export default defineConfig({
  locales: {
    source: 'en',
    directory: 'examples/sdk/quality/locales',
  },
  src: 'examples/sdk/quality/src',
  functions: ['t'],
});
