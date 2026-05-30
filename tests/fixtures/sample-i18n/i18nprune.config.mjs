/**
 * Minimal fixture config — see `README.md` in this directory.
 * Includes **`translate`** so **`generate`** parity / integration tests can run dry.
 */
import { fixtureTranslate } from '../shared/fixtureTranslate.mjs';

export default {
  locales: {
    source: 'en',
    directory: 'locales',
  },
  src: 'src',
  functions: ['t'],
  translate: fixtureTranslate,
  policies: {
    preserve: {},
    parity: {},
  },
};
