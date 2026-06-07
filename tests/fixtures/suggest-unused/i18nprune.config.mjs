/** Segmented layout with unused source keys and target extras for suggestion integration tests. */
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
