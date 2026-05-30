/** locale_directory + locale_per_dir — one folder per locale code. */
import { fixtureTranslate } from '../shared/fixtureTranslate.mjs';

export default {
  locales: {
    source: 'en',
    directory: 'messages',
    mode: 'locale_directory',
    structure: 'locale_per_dir',
  },
  src: 'src',
  functions: ['t'],
  translate: fixtureTranslate,
  policies: { preserve: {}, parity: {} },
};
