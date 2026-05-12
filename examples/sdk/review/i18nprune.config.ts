/**
 * Sample config consumed by the `runReview` SDK example.
 */
import { defineConfig } from '@i18nprune/core';

export default defineConfig({
  source: 'examples/sdk/review/locales/en.json',
  localesDir: 'examples/sdk/review/locales',
  src: 'examples/sdk/review/src',
  functions: ['t'],
});
