/** SvelteKit-shaped smoke — `.svelte` + locale_directory / locale_per_dir. */
import { fixtureTranslate } from '../../shared/fixtureTranslate.mjs';

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
  patching: {
    enabled: true,
    recipe: "loader_generated",
    configPath: "src/i18n/config.json",
    loaderPath: "src/i18n/loaders.generated.ts",
    localeJsonImportBase: "messages",
  },
};
