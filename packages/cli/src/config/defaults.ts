import { DEFAULT_SOURCE_LOCALE_LANGUAGE_CODE } from '@/constants/cli.js';
import type { I18nPruneConfig } from '@/types/config/index.js';

export const DEFAULT_CONFIG: I18nPruneConfig = {
  source: `locales/${DEFAULT_SOURCE_LOCALE_LANGUAGE_CODE}.json`,
  localesDir: 'locales',
  src: 'src',
  functions: ['t'],
  policies: {},
  reference: {
    defaults: {
      treatCommentedCallSitesAsRuntime: false,
      treatNonSourceFileSitesAsRuntime: false,
      uncertainKeyPolicy: 'protect',
      stringPresence: 'guard',
      stringPresenceMaxHitsPerKey: 5,
      respectPreserve: true,
    },
  },
  validate: {},
  missing: {},
};
