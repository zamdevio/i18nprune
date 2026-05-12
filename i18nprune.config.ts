import { defineConfig } from 'i18nprune/core';

export default defineConfig({
  source: 'locales/en.json',
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
  policies: {
    preserve: {},
    parity: {},
  },
});
