import { DEFAULT_SOURCE_LOCALE_LANGUAGE_CODE } from '@/constants/cli.js';
import type { I18nPruneConfig } from '@/types/config/index.js';

export const DEFAULT_CONFIG: I18nPruneConfig = {
  source: `locales/${DEFAULT_SOURCE_LOCALE_LANGUAGE_CODE}.json`,
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
  policies: {},
};
