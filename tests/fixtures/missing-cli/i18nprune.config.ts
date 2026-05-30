/** Tiny fixture: source locale has no keys referenced in code — for `missing` CLI tests. */
import { fixtureTranslate } from '../shared/fixtureTranslate.mjs';

export default {
  locales: {
    source: 'en',
    directory: 'locales',
  },
  src: 'src',
  functions: ['t'],
  translate: fixtureTranslate,
};
