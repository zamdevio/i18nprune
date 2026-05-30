/** flat_file + locale_file — one JSON file per locale at the bundle root. */
import { fixtureTranslate } from '../shared/fixtureTranslate.mjs';

export default {
  locales: {
    source: 'en',
    directory: 'locales',
    mode: 'flat_file',
    structure: 'locale_file',
  },
  src: 'src',
  functions: ['t'],
  translate: fixtureTranslate,
  policies: { preserve: {}, parity: {} },
};
