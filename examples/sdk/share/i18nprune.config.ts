import { defineConfig } from '@i18nprune/core/config';

export default defineConfig({
  locales: { source: 'en', directory: 'locales' },
  src: 'src',
  functions: ['t'],
});
