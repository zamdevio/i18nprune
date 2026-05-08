/** CLI-only locale helpers (styling, prompts, assertions). Pure engines live in `@i18nprune/core`. */
export {
  assertNotSourceTargetLocale,
  buildSourceLocaleTruthLabel,
  excludeSourceLocaleSlugs,
  getDisplaySourceLocaleCode,
  getSourceLocaleSlug,
  isSourceLocaleSlug,
} from './source.js';
export { resolveLocalesTargetCodes } from './targets.js';
