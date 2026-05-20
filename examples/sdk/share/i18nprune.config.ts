import { defineConfig } from '@i18nprune/core/config';

export default defineConfig({
  locales: { source: 'locales/en.json', directory: 'locales' },
  src: 'src',
  functions: ['t'],
});
