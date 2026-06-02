import { defineConfig, runSync, type I18nPruneConfig } from 'i18nprune/core';

const cfg: I18nPruneConfig = defineConfig({ locales: { source: 'en', directory: 'locales' } });
void cfg;
void runSync;
