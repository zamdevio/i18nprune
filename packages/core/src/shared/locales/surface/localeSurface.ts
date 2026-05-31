import { readLocaleCodeSurfaceFromContext } from '../read/index.js';
import { sourceLocaleCodeFromContext } from '../targets/context.js';
import type { CoreContext } from '../../../types/context/index.js';
import type { TranslationSurfaceLeaf } from '../../../types/locales/leaves/translationSurface.js';

/** All translation-surface leaves for one locale code (`flat_file`, `locale_per_dir`, or `feature_bundle`). */
export function readLocaleLeavesForCode(ctx: CoreContext, localeCode: string): TranslationSurfaceLeaf[] {
  const read = readLocaleCodeSurfaceFromContext(ctx, localeCode);
  if (!read.ok) return [];
  return read.leaves;
}

/** Merged leaves for the configured source locale (all segments when multi-file). */
export function readSourceLocaleLeaves(ctx: CoreContext): TranslationSurfaceLeaf[] {
  return readLocaleLeavesForCode(ctx, sourceLocaleCodeFromContext(ctx));
}
