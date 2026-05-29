import { readLocaleLeavesForCode } from '../shared/locales/surface/localeSurface.js';
import { resolveLocalesLayoutFromContext } from '../shared/locales/layout/resolveLayout.js';
import { readLocaleJsonFromContextSync } from '../shared/locales/read/bundle.js';
import { segmentsForLocaleCode, sourceLocaleCodeFromContext } from '../shared/locales/targets/index.js';
import type { CoreContext } from '../types/context/index.js';
import type { CleanupSourceSegmentRef } from '../types/cleanup/sourceSurface.js';
import type { TranslationSurfaceLeaf } from '../types/locales/leaves/translationSurface.js';
import { hasLocaleLeafAtPath } from '../shared/json/localeLeafPath.js';

/** All string leaves for the configured source locale (one file or merged multi-segment layout). */
export function readCleanupSourceLeaves(ctx: CoreContext): TranslationSurfaceLeaf[] {
  return readLocaleLeavesForCode(ctx, sourceLocaleCodeFromContext(ctx));
}

/** Source-locale segment files (flat_file → one path). */
export function listCleanupSourceSegmentPaths(ctx: CoreContext): CleanupSourceSegmentRef[] {
  const layout = resolveLocalesLayoutFromContext(ctx);
  if (layout.mode === 'flat_file') {
    const rel = ctx.adapters.path.relative(ctx.paths.localesDir, ctx.paths.sourceLocale);
    return [
      {
        absolutePath: ctx.paths.sourceLocale,
        relativePath: rel.length > 0 ? rel : ctx.adapters.path.basename(ctx.paths.sourceLocale),
      },
    ];
  }
  const sourceCode = sourceLocaleCodeFromContext(ctx);
  return segmentsForLocaleCode(ctx, sourceCode).map((s) => ({
    absolutePath: s.absolutePath,
    relativePath: s.relativePath,
  }));
}

/** Segment files that contain at least one of the given key paths on disk. */
export function listCleanupSourceSegmentsForKeys(
  ctx: CoreContext,
  keys: readonly string[],
): CleanupSourceSegmentRef[] {
  if (keys.length === 0) return [];
  return listCleanupSourceSegmentPaths(ctx).filter((segment) => {
    const raw = readLocaleJsonFromContextSync(ctx, segment.absolutePath);
    return keys.some((key) => hasLocaleLeafAtPath(raw, key));
  });
}
