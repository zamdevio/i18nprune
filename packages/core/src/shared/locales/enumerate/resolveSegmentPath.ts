import type { ResolvedLocalesLayout } from '../../../types/locales/layout.js';
import type { LocaleLeafPathApi } from '../../../types/locales/leaves/fileOrigin.js';
import type { LocaleSegmentRef } from '../../../types/locales/enumerate.js';
import { localeCodeForSegment } from './parseSegmentLocale.js';

/**
 * Build the absolute path for a locale segment under `layout.directoryAbsolute`.
 *
 * @param segmentRelativePath — Bundle-root–relative path (`en.json`, `en/auth.json`, `auth/en.json`).
 *   When omitted, defaults to `${locale}.json` at the bundle root (`locale_file` / `feature_bundle` only).
 */
export function resolveLocaleSegmentAbsolutePath(input: {
  layout: ResolvedLocalesLayout;
  path: LocaleLeafPathApi;
  locale: string;
  segmentRelativePath?: string;
}): string {
  const { layout, path, locale } = input;
  const rel = input.segmentRelativePath ?? `${locale}.json`;
  return path.join(layout.directoryAbsolute, rel);
}

/**
 * Map an absolute segment file path to {@link LocaleSegmentRef}, or `null` when outside the bundle or
 * not a valid segment for the layout structure.
 */
export function localeSegmentRefFromAbsolute(input: {
  layout: ResolvedLocalesLayout;
  path: LocaleLeafPathApi;
  absolutePath: string;
}): LocaleSegmentRef | null {
  const { layout, path, absolutePath } = input;
  let relativePath = path.relative(layout.directoryAbsolute, absolutePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }
  relativePath = relativePath.replace(/\\/g, '/');
  if (!relativePath.endsWith('.json') || relativePath.endsWith('.meta.json')) {
    return null;
  }
  const locale = localeCodeForSegment(layout.structure, path, { absolutePath, relativePath });
  if (locale === null) return null;
  return { locale, relativePath, absolutePath };
}
