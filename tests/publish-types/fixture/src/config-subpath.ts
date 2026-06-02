import { defineConfig, type I18nPruneConfig } from 'i18nprune/core/config';

export default defineConfig({
  locales: { source: 'en', directory: 'locales' },
} satisfies Partial<I18nPruneConfig>);
