import { defineConfig } from '@zamdevio/i18nprune/config';

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
