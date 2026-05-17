/**
 * Sample config consumed by the `runDoctor` SDK example.
 */
import { defineConfig } from '@i18nprune/core';

export default defineConfig({
  locales: {
    source: 'examples/sdk/doctor/locales/en.json',
    directory: 'examples/sdk/doctor/locales',
  },
  src: 'examples/sdk/doctor/src',
  functions: ['t'],
});
