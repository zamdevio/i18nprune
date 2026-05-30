/** Misconfigured: locale_directory without required structure (readiness should fail). */
import { fixtureTranslate } from '../shared/fixtureTranslate.mjs';

export default {
  locales: {
    source: 'en',
    directory: 'messages',
    mode: 'locale_directory',
  },
  src: 'src',
  functions: ['t'],
  translate: fixtureTranslate,
};
