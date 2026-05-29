import { readLocaleBundle } from '../read/bundle.js';
import { readLocalePerDirLocaleSurface } from '../read/perDirLocaleSurface.js';
import { resolveLocalesLayoutFromContext } from '../layout/resolveLayout.js';
import { primarySegmentForLocale, sourceLocaleCodeFromContext } from '../targets/context.js';
import type { CoreContext } from '../../../types/context/index.js';
import type { TranslationSurfaceLeaf } from '../../../types/locales/leaves/translationSurface.js';

/** All translation-surface leaves for one locale code (`flat_file`, `locale_per_dir`, or `feature_bundle`). */
export function readLocaleLeavesForCode(ctx: CoreContext, localeCode: string): TranslationSurfaceLeaf[] {
  const layout = resolveLocalesLayoutFromContext(ctx);
  const { fs, path } = ctx.adapters;

  if (layout.mode === 'flat_file') {
    const segment = primarySegmentForLocale(ctx, localeCode);
    const absoluteFile = segment?.absolutePath ?? ctx.paths.sourceLocale;
    const read = readLocaleBundle({ layout, fs, path, absoluteFile });
    return read.leaves;
  }

  const read = readLocalePerDirLocaleSurface({ layout, fs, path, localeCode });
  return read.leaves;
}

/** Merged leaves for the configured source locale (all segments when multi-file). */
export function readSourceLocaleLeaves(ctx: CoreContext): TranslationSurfaceLeaf[] {
  return readLocaleLeavesForCode(ctx, sourceLocaleCodeFromContext(ctx));
}
