/** Next.js App Router-shaped stack smoke — `app/` TSX with `t()`. */
import { fixtureTranslate } from '../../shared/fixtureTranslate.mjs';

export default {
  locales: {
    source: 'locales/en.json',
    directory: 'locales',
  },
  src: 'app',
  functions: ['t'],
  translate: fixtureTranslate,
  policies: { preserve: {}, parity: {} },
};
