/**
 * App-owned i18n wiring. i18nprune only regenerates `./loaders.generated.ts` during patching.
 * Use any i18n library; import lazy locale bundles from `./loaders.generated.js`. See docs/patching/loader.md.
 */
export {
  getDefaultLocaleCode,
  getLocale,
  getLocales,
  loadLocaleMessages,
} from './loaders.generated.js';
