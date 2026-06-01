import type { CoreContext } from '../../../types/context/index.js';
import { listLocaleCodesFromContext, listLocaleSegmentsFromContext } from '../enumerate/fromContext.js';
import { localeSegmentRefFromAbsolute } from '../enumerate/resolveSegmentPath.js';
import { resolveLocalesLayoutFromContext } from '../layout/resolveLayout.js';
import { normalizeLanguageCode } from '../../languages/normalize.js';
import type { LocaleSegmentTarget, ResolveLocaleSegmentTargetsInput } from '../../../types/locales/targets.js';

function normalizeCode(code: string): string {
  return normalizeLanguageCode(code);
}

/** All locale JSON segments under the configured bundle root. */
export function listLocaleSegmentTargets(ctx: CoreContext): LocaleSegmentTarget[] {
  const { segments } = listLocaleSegmentsFromContext(ctx);
  return segments.map((segment) => ({
    ...segment,
    reportKey: segment.relativePath,
  }));
}

/** Locale code for `ctx.paths.sourceLocale` using layout rules (not only basename). */
export function sourceLocaleCodeFromContext(ctx: CoreContext): string {
  const layout = resolveLocalesLayoutFromContext(ctx);
  const ref = localeSegmentRefFromAbsolute({
    layout,
    path: ctx.adapters.path,
    absolutePath: ctx.paths.sourceLocale,
  });
  if (ref !== null) {
    return normalizeCode(ref.locale);
  }
  return normalizeCode(ctx.adapters.path.basename(ctx.paths.sourceLocale, '.json'));
}

/** Distinct locale codes present in the bundle (sorted). */
export function localeCodesFromContext(ctx: CoreContext): string[] {
  return listLocaleCodesFromContext(ctx).codes.map((c) => normalizeCode(c));
}

/** Non-source locale codes (sorted). */
export function targetLocaleCodesFromContext(ctx: CoreContext): string[] {
  const source = sourceLocaleCodeFromContext(ctx);
  return localeCodesFromContext(ctx).filter((c) => c !== source);
}

export function segmentsForLocaleCode(ctx: CoreContext, localeCode: string): LocaleSegmentTarget[] {
  const want = normalizeCode(localeCode);
  return listLocaleSegmentTargets(ctx).filter((s) => normalizeCode(s.locale) === want);
}

/** Primary segment for a locale (source path match, else lexicographically first). */
export function primarySegmentForLocale(ctx: CoreContext, localeCode: string): LocaleSegmentTarget | undefined {
  const segments = segmentsForLocaleCode(ctx, localeCode);
  if (segments.length === 0) return undefined;
  const sourceResolved = ctx.adapters.path.resolve(ctx.paths.sourceLocale);
  const sourceMatch = segments.find((s) => ctx.adapters.path.resolve(s.absolutePath) === sourceResolved);
  if (sourceMatch) return sourceMatch;
  return segments.slice().sort((a, b) => a.relativePath.localeCompare(b.relativePath))[0];
}

/**
 * Segment files to process for sync / quality / review style ops (one row per on-disk JSON segment).
 */
export function resolveLocaleSegmentTargets(
  ctx: CoreContext,
  input: ResolveLocaleSegmentTargetsInput,
): { segments: LocaleSegmentTarget[]; missingLocaleCodes: string[] } {
  const source = sourceLocaleCodeFromContext(ctx);
  const all = listLocaleSegmentTargets(ctx).filter((s) => normalizeCode(s.locale) !== source);

  if (input.selection.mode === 'all') {
    return { segments: all, missingLocaleCodes: [] };
  }

  const missingLocaleCodes: string[] = [];
  const segments: LocaleSegmentTarget[] = [];

  for (const code of input.selection.codes) {
    const norm = normalizeCode(code);
    const forCode = all.filter((s) => normalizeCode(s.locale) === norm);
    if (forCode.length === 0) {
      missingLocaleCodes.push(norm);
      continue;
    }
    segments.push(...forCode);
  }

  segments.sort((a, b) => {
    const byLocale = a.locale.localeCompare(b.locale);
    if (byLocale !== 0) return byLocale;
    return a.relativePath.localeCompare(b.relativePath);
  });

  return { segments, missingLocaleCodes };
}
