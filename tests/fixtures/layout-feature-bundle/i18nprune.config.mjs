/** locale_directory + feature_bundle — feature folders with <locale>.json inside. */
import { fixtureTranslate } from '../shared/fixtureTranslate.mjs';

export default {
  locales: {
    source: 'messages/auth/en.json',
    directory: 'messages',
    mode: 'locale_directory',
    structure: 'feature_bundle',
  },
  src: 'src',
  functions: ['t'],
  translate: fixtureTranslate,
  policies: { preserve: {}, parity: {} },
};
