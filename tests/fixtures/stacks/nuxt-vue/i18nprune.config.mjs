/** Nuxt-shaped paths — `src/pages` + `src/components` Vue SFCs. */
import { fixtureTranslate } from '../../shared/fixtureTranslate.mjs';

export default {
  locales: {
    source: 'locales/en/messages.json',
    directory: 'locales',
    mode: 'locale_directory',
    structure: 'locale_per_dir',
  },
  src: 'src',
  functions: ['t'],
  translate: fixtureTranslate,
  policies: { preserve: {}, parity: { excludeKeys: ['layout.brand']} },
};
