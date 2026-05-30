import { defineConfig } from 'i18nprune/core';

export default defineConfig({
  locales: {
    source: 'en',
    directory: 'locales',
  },
  src: 'src',
  functions: ['t'],
  policies: {
    preserve: {},
    parity: {},
  },
});
