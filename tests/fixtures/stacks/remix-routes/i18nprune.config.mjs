/** Remix-shaped route modules under `app/routes/`. */
import { fixtureTranslate } from '../../shared/fixtureTranslate.mjs';

export default {
  locales: {
    source: 'locales/en/messages.json',
    directory: 'locales',
    mode: 'locale_directory',
    structure: 'locale_per_dir',
  },
  src: 'app',
  functions: ['t'],
  translate: fixtureTranslate,
  policies: { preserve: {}, parity: {} },
};
