import { localeSegmentRefFromAbsolute } from '../enumerate/resolveSegmentPath.js';
import { resolveLocalesLayoutFromContext } from '../layout/resolveLayout.js';
import { normalizeLanguageCode } from '../../languages/normalize.js';
import { segmentsForLocaleCode } from '../targets/context.js';
import type { CoreContext } from '../../../types/context/index.js';
import type { LocaleReadCache } from '../../../types/locales/readCache.js';

export function createLocaleReadCache(): LocaleReadCache {
  return {
    segments: new Map(),
    localeCodes: new Map(),
  };
}

export function invalidateLocaleReadCacheForAbsolutePath(ctx: CoreContext, absolutePath: string): void {
  ctx.localeRead.segments.delete(absolutePath);
  const layout = resolveLocalesLayoutFromContext(ctx);
  const ref = localeSegmentRefFromAbsolute({
    layout,
    path: ctx.adapters.path,
    absolutePath,
  });
  if (ref !== null) {
    ctx.localeRead.localeCodes.delete(normalizeLanguageCode(ref.locale));
  }
}

export function dropLocaleCodeReadCache(ctx: CoreContext, localeCode: string): void {
  ctx.localeRead.localeCodes.delete(normalizeLanguageCode(localeCode));
}

/** Drop cached segment reads and merged locale-code view for one catalog code. */
export function invalidateLocaleReadCacheForLocaleCode(ctx: CoreContext, localeCode: string): void {
  const normalized = normalizeLanguageCode(localeCode);
  dropLocaleCodeReadCache(ctx, normalized);
  for (const segment of segmentsForLocaleCode(ctx, normalized)) {
    ctx.localeRead.segments.delete(segment.absolutePath);
  }
}
