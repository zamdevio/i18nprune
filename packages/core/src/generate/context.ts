import { I18nPruneError } from '../shared/errors/index.js';
import { createLocaleReadCache } from '../shared/locales/read/index.js';
import { createTranslateContext, type TranslateContext } from '../translator/context.js';
import type { CoreContext } from '../types/context/index.js';

export function createCoreContext(input: {
  config: CoreContext['config'];
  adapters: CoreContext['adapters'];
  env: CoreContext['env'];
  paths: CoreContext['paths'];
  configFileLoaded?: CoreContext['configFileLoaded'];
  run?: CoreContext['run'];
  cache?: CoreContext['cache'];
  localeRead?: CoreContext['localeRead'];
}): CoreContext {
  return {
    config: input.config,
    adapters: input.adapters,
    env: input.env,
    paths: input.paths,
    localeRead: input.localeRead ?? createLocaleReadCache(),
    ...(input.configFileLoaded !== undefined ? { configFileLoaded: input.configFileLoaded } : {}),
    ...(input.run !== undefined ? { run: input.run } : {}),
    ...(input.cache !== undefined ? { cache: input.cache } : {}),
  };
}

/** Project-wide ops pass this into {@link runTranslate} / translator helpers that only need the translate block. */
export function translateContextFromCore(ctx: CoreContext): TranslateContext {
  const t = ctx.config.translate;
  if (!t) {
    throw new I18nPruneError('config.translate is required for translation operations', 'USAGE');
  }
  return createTranslateContext({
    config: t,
    adapters: ctx.adapters,
    env: ctx.env,
  });
}
