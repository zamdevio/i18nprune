import { resolveLocaleSegmentAbsolutePath } from '../enumerate/resolveSegmentPath.js';
import { resolveLocalesLayoutFromContext } from '../layout/resolveLayout.js';
import {
  primarySegmentForLocale,
  segmentsForLocaleCode,
  sourceLocaleCodeFromContext,
  swapLocaleInSegmentRelativePath,
} from '../targets/index.js';
import type { CoreContext } from '../../../types/context/index.js';
import type { TranslationSurfaceLeaf } from '../../../types/locales/leaves/translationSurface.js';

/** Map a target segment path to its paired source segment (`auth/fr.json` → `auth/en.json`). */
export function pairedSourceSegmentRelativePath(
  ctx: CoreContext,
  targetSegmentRelativePath: string,
  _targetLocaleCode: string,
): string | null {
  const layout = resolveLocalesLayoutFromContext(ctx);
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  return swapLocaleInSegmentRelativePath({
    structure: layout.structure,
    relativePath: targetSegmentRelativePath,
    targetLocale: sourceCode,
  });
}

export function resolvePairedSourceSegmentAbsolutePath(
  ctx: CoreContext,
  targetSegmentRelativePath: string,
  targetLocaleCode: string,
): string {
  const layout = resolveLocalesLayoutFromContext(ctx);
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const sourceRel =
    pairedSourceSegmentRelativePath(ctx, targetSegmentRelativePath, targetLocaleCode) ??
    targetSegmentRelativePath;
  return resolveLocaleSegmentAbsolutePath({
    layout,
    path: ctx.adapters.path,
    locale: sourceCode,
    segmentRelativePath: sourceRel,
  });
}

function inferSourceSegmentRelativePath(ctx: CoreContext, key: string): string {
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const segments = segmentsForLocaleCode(ctx, sourceCode);
  const layout = resolveLocalesLayoutFromContext(ctx);
  const primary = primarySegmentForLocale(ctx, sourceCode);
  const fallback = primary?.relativePath ?? segments[0]?.relativePath ?? `${sourceCode}.json`;

  if (layout.structure !== 'feature_bundle' || segments.length <= 1) {
    return fallback;
  }

  const featureDirs = new Set(
    segments
      .map((s) => {
        const slash = s.relativePath.indexOf('/');
        return slash >= 0 ? s.relativePath.slice(0, slash) : null;
      })
      .filter((name): name is string => name !== null && name.length > 0),
  );

  const top = key.includes('.') ? key.slice(0, key.indexOf('.')) : key;
  if (featureDirs.has(top)) {
    return `${top}/${sourceCode}.json`;
  }
  return fallback;
}

/** Source segment file that owns a logical key path (existing leaf origin or feature_bundle inference). */
export function sourceSegmentRelativePathForKey(
  ctx: CoreContext,
  key: string,
  sourceLeaves: readonly TranslationSurfaceLeaf[],
): string {
  const existing = sourceLeaves.find((leaf) => leaf.path === key);
  if (existing?.fileOrigin?.relativePath) {
    return existing.fileOrigin.relativePath;
  }
  return inferSourceSegmentRelativePath(ctx, key);
}

/** Target segment file that should receive a logical key path for a locale code. */
export function targetSegmentRelativePathForKey(
  ctx: CoreContext,
  localeCode: string,
  key: string,
  sourceLeaves: readonly TranslationSurfaceLeaf[],
): string {
  const layout = resolveLocalesLayoutFromContext(ctx);
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  const sourceRel = sourceSegmentRelativePathForKey(ctx, key, sourceLeaves);

  if (localeCode === sourceCode) {
    return sourceRel;
  }

  const swapped = swapLocaleInSegmentRelativePath({
    structure: layout.structure,
    relativePath: sourceRel,
    targetLocale: localeCode,
  });
  if (swapped !== null) {
    return swapped;
  }

  const primary = primarySegmentForLocale(ctx, localeCode);
  return primary?.relativePath ?? `${localeCode}.json`;
}
