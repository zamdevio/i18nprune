/**
 * Sample config consumed by the `runMissing` SDK example.
 */
import { defineConfig } from '@i18nprune/core';

export default defineConfig({
  source: 'examples/sdk/missing/locales/en.json',
  localesDir: 'examples/sdk/missing/locales',
  src: 'examples/sdk/missing/src',
  functions: ['t'],
});
