/** Next.js App Router-shaped stack smoke — `app/` TSX with `t()`. */
import { fixtureTranslate } from '../../shared/fixtureTranslate.mjs';

export default {
  locales: {
    source: 'en',
    directory: 'messages',
    mode: 'locale_directory',
    structure: 'feature_bundle',
  },
  src: 'app',
  functions: ['t'],
  translate: fixtureTranslate,
  policies: { preserve: {}, parity: {} },
};
