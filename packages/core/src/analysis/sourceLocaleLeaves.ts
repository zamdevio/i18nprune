import { readLocaleBundle } from '../shared/locales/read/bundle.js';
import { readLocalePerDirLocaleSurface } from '../shared/locales/read/perDirLocaleSurface.js';
import { resolveLocalesLayoutFromContext } from '../shared/locales/layout/resolveLayout.js';
import { sourceLocaleCodeFromContext } from '../shared/locales/targets/context.js';
import type { CoreContext } from '../types/context/index.js';
import type { TranslationSurfaceLeaf } from '../types/locales/leaves/translationSurface.js';

/**
 * All translation-surface leaves for the configured source locale (one file or every source segment).
 */
export function readSourceLocaleLeavesForMissing(ctx: CoreContext): TranslationSurfaceLeaf[] {
  const layout = resolveLocalesLayoutFromContext(ctx);
  const { fs, path } = ctx.adapters;

  if (layout.mode === 'flat_file') {
    const read = readLocaleBundle({
      layout,
      fs,
      path,
      absoluteFile: ctx.paths.sourceLocale,
    });
    return read.leaves;
  }

  const read = readLocalePerDirLocaleSurface({
    layout,
    fs,
    path,
    localeCode: sourceLocaleCodeFromContext(ctx),
  });
  return read.leaves;
}
