/** React / Vite-shaped stack smoke — `.tsx` with `t()` + cache profile. */
import { fixtureTranslate } from '../../shared/fixtureTranslate.mjs';

export default {
  locales: {
    source: 'locales/en.json',
    directory: 'locales',
    mode: 'flat_file',
    structure: 'locale_file',
  },
  src: 'src',
  functions: ['t'],
  cache: { profile: 'balanced' },
  translate: fixtureTranslate,
  policies: { preserve: {}, parity: {} },
};
